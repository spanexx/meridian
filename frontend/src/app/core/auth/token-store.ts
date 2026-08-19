/**
 * TokenStore — session token holder (in-memory + sessionStorage).
 *
 * Single source of truth for the access token. Provides get/set/clear
 * with automatic persistence to sessionStorage so the token survives
 * page reloads within the same session. The auth pack owns login/
 * refresh logic; this store is a passive holder.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { Injectable } from '@angular/core';

const STORAGE_KEY = 'meridian_access_token';

@Injectable({ providedIn: 'root' })
export class TokenStore {
  private _token: string | null = null;
  private _initialized = false;

  constructor() {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      this._token = sessionStorage.getItem(STORAGE_KEY);
      this._initialized = true;
    }
  }

  /** Current token (null if not set or expired). */
  get token(): string | null {
    if (!this._initialized && typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      this._token = sessionStorage.getItem(STORAGE_KEY);
      this._initialized = true;
    }
    return this._token;
  }

  /** Store a new token and persist it. */
  set(token: string): void {
    this._token = token;
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, token);
    }
  }

  /** Clear the token and remove from storage. */
  clear(): void {
    this._token = null;
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  /** True when a token is present. */
  hasToken(): boolean {
    return this.token !== null;
  }
}