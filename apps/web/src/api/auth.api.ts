/**
 * Authentication API Service
 */

import { apiClient } from './client.js';
import {
  PreloginResponse,
  RegisterRequest,
  AuthResponse,
  UserProfileResponse,
  SessionItem,
} from '../types/api.types.js';

export const authApi = {
  // Prelogin (Anti-User Enumeration)
  prelogin: async (email: string): Promise<PreloginResponse> => {
    const res = await apiClient.post<PreloginResponse>('/v1/auth/prelogin', { email });
    return res.data;
  },

  // Register
  register: async (payload: RegisterRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/v1/auth/register', payload);
    return res.data;
  },

  // Login
  login: async (email: string, authKey: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/v1/auth/login', { email, authKey });
    return res.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await apiClient.post('/v1/auth/logout');
  },

  // Refresh
  refresh: async (): Promise<{ accessToken: string }> => {
    const res = await apiClient.post<{ accessToken: string }>('/v1/auth/refresh');
    return res.data;
  },

  // Get Current User Profile
  getMe: async (): Promise<UserProfileResponse['user']> => {
    const res = await apiClient.get<UserProfileResponse>('/v1/auth/me');
    return res.data.user;
  },

  // Verify Email
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/v1/auth/verify-email', { token });
    return res.data;
  },

  // Resend Email Verification Link
  resendVerification: async (email: string): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/v1/auth/resend-verification', { email });
    return res.data;
  },

  // Confirm Recovery Challenge
  confirmRecovery: async (): Promise<{ message: string; recovery_confirmed_at: string }> => {
    const res = await apiClient.post<{ message: string; recovery_confirmed_at: string }>('/v1/auth/recovery/confirm');
    return res.data;
  },

  // Change Password
  changePassword: async (payload: {
    oldAuthKey: string;
    newAuthKey: string;
    new_wrapped_master_key: string;
    new_key_nonce: string;
    new_kdf_salt: string;
    new_kdf_params?: {
      memory_kib: number;
      iterations: number;
      parallelism: number;
    };
  }): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/v1/auth/change-password', payload);
    return res.data;
  },

  // Get Active Sessions
  getSessions: async (): Promise<SessionItem[]> => {
    const res = await apiClient.get<{ sessions: SessionItem[] }>('/v1/auth/sessions');
    return res.data.sessions;
  },

  // Revoke Specific Session
  revokeSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/v1/auth/sessions/${sessionId}`);
  },

  // Logout All Sessions
  logoutAll: async (): Promise<void> => {
    await apiClient.post('/v1/auth/logout-all');
  },

  // GDPR Article 17: Permanent Account Deletion
  deleteAccount: async (confirmationText: string): Promise<void> => {
    await apiClient.delete('/v1/auth/account', {
      data: { confirmationText }
    });
  },
};

