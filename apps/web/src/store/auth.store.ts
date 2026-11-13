/**
 * Ephemeral In-Memory Authentication & Key Store
 *
 * ZERO-KNOWLEDGE INVARIANT:
 * - masterKeyHex, kekHex, and accessToken are NEVER persisted to localStorage/sessionStorage/IndexedDB.
 * - On page reload or tab closure, keys are wiped and user must re-enter credentials or unlock.
 */

import { UserProfileResponse } from '../types/api.types.js';
import { setAccessToken } from '../api/client.js';

export interface AuthState {
  user: UserProfileResponse['user'] | null;
  masterKeyHex: string | null;
  kekHex: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthSubscriber = (state: AuthState) => void;

class AuthStore {
  private state: AuthState = {
    user: null,
    masterKeyHex: null,
    kekHex: null,
    isAuthenticated: false,
    isLoading: false,
  };

  private subscribers = new Set<AuthSubscriber>();

  constructor() {
    // Listen for silent refresh expiration event
    if (typeof window !== 'undefined') {
      window.addEventListener('cloudvault:session_expired', () => {
        this.clearAuth();
      });
    }
  }

  public getState(): AuthState {
    return { ...this.state };
  }

  public subscribe(fn: AuthSubscriber): () => void {
    this.subscribers.add(fn);
    fn(this.getState());
    return () => this.subscribers.delete(fn);
  }

  private notify() {
    const currentState = this.getState();
    this.subscribers.forEach((fn) => fn(currentState));
  }

  public setAuthenticated(user: UserProfileResponse['user'], token: string, masterKeyHex: string, kekHex: string) {
    setAccessToken(token);
    this.state = {
      user,
      masterKeyHex,
      kekHex,
      isAuthenticated: true,
      isLoading: false,
    };
    this.notify();
  }

  public updateUser(user: UserProfileResponse['user']) {
    this.state = {
      ...this.state,
      user,
    };
    this.notify();
  }

  public updateKeys(newMasterKeyHex: string, newKekHex: string) {
    this.state = {
      ...this.state,
      masterKeyHex: newMasterKeyHex,
      kekHex: newKekHex,
    };
    this.notify();
  }

  public setLoading(loading: boolean) {
    this.state = {
      ...this.state,
      isLoading: loading,
    };
    this.notify();
  }

  public clearAuth() {
    setAccessToken(null);
    this.state = {
      user: null,
      masterKeyHex: null,
      kekHex: null,
      isAuthenticated: false,
      isLoading: false,
    };
    this.notify();
  }
}

export const authStore = new AuthStore();

