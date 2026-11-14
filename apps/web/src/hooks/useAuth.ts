/**
 * Custom hook for Authentication and Zero-Knowledge Credential Lifecycle
 */

import { useState, useEffect } from 'react';
import { authStore, AuthState } from '../store/auth.store.js';
import { authApi } from '../api/auth.api.js';
import { cryptoBridge } from '../crypto/crypto-bridge.js';
import { DOMAIN_TAGS, getRandomBytes, toHex } from '../crypto/web-crypto-engine.js';

export function useAuth() {
  const [state, setState] = useState<AuthState>(authStore.getState());

  useEffect(() => {
    return authStore.subscribe(setState);
  }, []);

  // 1. Zero-Knowledge Login Flow
  const login = async (email: string, password: string) => {
    authStore.setLoading(true);
    try {
      // Step A: Anti-User Enumeration Prelogin
      const pre = await authApi.prelogin(email);

      // Step B: Derive AuthKey & KEK in Web Worker
      const { authKeyHex, kekHex } = await cryptoBridge.deriveKeys(password, pre.salt, {
        iterations: pre.kdf_params?.t,
        memoryBytes: pre.kdf_params?.m ? pre.kdf_params.m * 1024 : undefined,
      });

      // Step C: Authenticate with Backend using AuthKey
      const authRes = await authApi.login(email, authKeyHex);

      // Step D: Unwrap MasterKey using derived KEK in Web Worker
      const wrapPayload = typeof authRes.encrypted_master_key === 'string'
        ? JSON.parse(authRes.encrypted_master_key)
        : authRes.encrypted_master_key;

      const masterKeyHex = await cryptoBridge.unwrapMasterKey(
        kekHex,
        wrapPayload,
        'cloudvault-master-key-wrap-v1'
      );

      // Store in volatile memory
      authStore.setAuthenticated(authRes.user as any, authRes.accessToken, masterKeyHex, kekHex);
      return { success: true };
    } catch (error: any) {
      throw error;
    } finally {
      authStore.setLoading(false);
    }
  };

  // 2. Zero-Knowledge Registration Flow with 24-Word Emergency Kit
  const register = async (email: string, password: string, mnemonic: string) => {
    authStore.setLoading(true);
    try {
      // Step A: Generate random 16-byte KDF salt & 32-byte MasterKey
      const saltBytes = getRandomBytes(16);
      const saltHex = toHex(saltBytes);
      const masterKeyBytes = getRandomBytes(32);
      const masterKeyHex = toHex(masterKeyBytes);

      // Step B: Derive AuthKey & KEK via Argon2id in Web Worker
      const { authKeyHex, kekHex } = await cryptoBridge.deriveKeys(password, saltHex);

      // Step C: Wrap MasterKey with KEK for password login
      const wrappedWithKek = await cryptoBridge.wrapMasterKey(kekHex, masterKeyHex, 'cloudvault-master-key-wrap-v1');

      // Step D: Wrap MasterKey with 24-Word Recovery Phrase for emergency recovery
      const wrappedWithRecovery = await cryptoBridge.wrapMasterKeyWithRecovery(masterKeyHex, mnemonic);

      // Step E: Register with backend (sending only AuthKey and wrapped blobs)
      await authApi.register({
        email,
        authKey: authKeyHex,
        salt: saltHex,
        kdf_version: '1.0',
        kdf_params: { m: 65536, t: 3, p: 1 },
        encrypted_master_key: JSON.stringify(wrappedWithKek),
        master_key_nonce: wrappedWithKek.iv,
        encrypted_recovery_master_key: JSON.stringify(wrappedWithRecovery),
        recovery_master_key_nonce: wrappedWithRecovery.iv,
      });

      // Step F: Authenticate session with backend to acquire accessToken & cookie
      const loginRes = await authApi.login(email, authKeyHex);

      // Confirm Recovery Kit since user viewed and confirmed mnemonic in RecoveryModal
      try {
        const confirmRes = await authApi.confirmRecovery();
        loginRes.user.recovery_confirmed_at = confirmRes.recovery_confirmed_at;
      } catch (confirmErr) {
        console.warn('[useAuth] Registration recovery confirmation note:', confirmErr);
      }

      authStore.setAuthenticated(loginRes.user as any, loginRes.accessToken, masterKeyHex, kekHex);
      return { success: true };
    } catch (error: any) {
      throw error;
    } finally {
      authStore.setLoading(false);
    }
  };

  // 3. Logout
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      authStore.clearAuth();
    }
  };

  // 4. Change Password (Zero File Re-Encryption)
  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!state.masterKeyHex || !state.user) {
      throw new Error('Active session with unlocked master key required');
    }

    // Derive old credentials
    const pre = await authApi.prelogin(state.user.email);
    const { authKeyHex: oldAuthKeyHex } = await cryptoBridge.deriveKeys(oldPassword, pre.salt);

    // Generate new salt and derive new credentials
    const newSaltHex = toHex(getRandomBytes(16));
    const { authKeyHex: newAuthKeyHex, kekHex: newKekHex } = await cryptoBridge.deriveKeys(newPassword, newSaltHex);

    // Re-wrap the SAME MasterKey with the new KEK
    const newWrapped = await cryptoBridge.wrapMasterKey(newKekHex, state.masterKeyHex, DOMAIN_TAGS.MASTER_KEY_WRAP);

    // Call backend
    await authApi.changePassword({
      oldAuthKey: oldAuthKeyHex,
      newAuthKey: newAuthKeyHex,
      new_wrapped_master_key: newWrapped.ct + newWrapped.tag,
      new_key_nonce: newWrapped.iv,
      new_kdf_salt: newSaltHex,
      new_kdf_params: {
        memory_kib: 65536,
        iterations: 3,
        parallelism: 1,
      },
    });

    // Update in-memory KEK
    authStore.updateKeys(state.masterKeyHex, newKekHex);
  };

  // 5. Check Active Session on Mount
  const checkSession = async () => {
    authStore.setLoading(true);
    try {
      const refreshed = await authApi.refresh();
      if (refreshed?.accessToken) {
        const user = await authApi.getMe();
        authStore.updateUser(user);
      }
    } catch (err) {
      authStore.clearAuth();
    } finally {
      authStore.setLoading(false);
    }
  };

  return {
    ...state,
    login,
    register,
    logout,
    changePassword,
    checkSession,
  };
}
