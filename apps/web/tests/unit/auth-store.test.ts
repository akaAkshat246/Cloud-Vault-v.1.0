import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authStore } from '../../src/store/auth.store.js';

describe('AuthStore — Zero-Knowledge In-Memory Security & Lifecycle', () => {
  beforeEach(() => {
    authStore.clearAuth();
  });

  it('1. Holds MasterKey and KEK in volatile memory without localStorage persistence', () => {
    const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem');

    const mockUser: any = {
      id: 'usr_123',
      email: 'security.auditor@cloudvault.internal',
      storage_used_bytes: '1024',
      storage_quota_bytes: '5368709120',
      recovery_confirmed_at: '2026-11-12T00:00:00Z',
      is_email_verified: true,
    };

    authStore.setAuthenticated(
      mockUser,
      'jwt_access_token_sample',
      '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
      '4e9e59a9f30c3c7ad916d32a19a236e2b376c43a41590119687ed6e289d54d2f'
    );

    const state = authStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('security.auditor@cloudvault.internal');
    expect(state.masterKeyHex).toBe('11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff');
    expect(state.kekHex).toBe('4e9e59a9f30c3c7ad916d32a19a236e2b376c43a41590119687ed6e289d54d2f');

    // Invariant: Zero keys or tokens written to browser localStorage
    expect(localStorageSpy).not.toHaveBeenCalled();
    localStorageSpy.mockRestore();
  });

  it('2. Wipes all keys and tokens on logout or clearAuth', () => {
    authStore.clearAuth();
    const state = authStore.getState();

    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.masterKeyHex).toBeNull();
    expect(state.kekHex).toBeNull();
  });

  it('3. Clears memory upon session_expired window event', () => {
    const mockUser: any = { id: 'usr_123', email: 'test@cloudvault.internal' };
    authStore.setAuthenticated(mockUser, 'token', 'master_key', 'kek');

    expect(authStore.getState().isAuthenticated).toBe(true);

    // Dispatch global event
    window.dispatchEvent(new CustomEvent('cloudvault:session_expired'));

    expect(authStore.getState().isAuthenticated).toBe(false);
    expect(authStore.getState().masterKeyHex).toBeNull();
  });
});

