/**
 * TokenStore — session token holder (in-memory + sessionStorage).
 *
 * Single source of truth for the access-token session. Holds the access
 * token, the refresh token, and the access-token expiry. Provides
 * get/set/clear with automatic persistence to sessionStorage so the
 * session survives page reloads within the same browser session.
 *
 * Pack C (2026-08-19): extended from a single access token to a full
 * session (access + refresh + expiry) to back the auth-guard / refresh
 * flow. `set()` / `token` / `hasToken()` / `clear()` remain source-
 * compatible with the interceptor and AuthStore.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-19
 */
import { Injectable } from '@angular/core';

const ACCESS_KEY = 'meridian_access_token';
const REFRESH_KEY = 'meridian_refresh_token';
const EXPIRES_KEY = 'meridian_token_expires_at';

/** Backing storage with the minimal SessionStorage surface. */
interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** A token pair (optionally with an access-token lifetime in seconds). */
export interface TokenSession {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

@Injectable({ providedIn: 'root' })
export class TokenStore {
  private _token: string | null = null;
  private _refreshToken: string | null = null;
  private _expiresAt: number | null = null;
  private _initialized = false;

  private get storage(): StorageLike | null {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return null;
    }
    return sessionStorage;
  }

  private init(): void {
    if (this._initialized) return;
    const s = this.storage;
    if (s) {
      this._token = s.getItem(ACCESS_KEY);
      this._refreshToken = s.getItem(REFRESH_KEY);
      const exp = s.getItem(EXPIRES_KEY);
      this._expiresAt = exp ? Number(exp) : null;
    }
    this._initialized = true;
  }

  /** Current access token (null if not set). */
  get token(): string | null {
    this.init();
    return this._token;
  }

  /** Current refresh token (null if not set). */
  get refreshToken(): string | null {
    this.init();
    return this._refreshToken;
  }

  /** Access-token expiry as epoch ms (null when no expiry was recorded). */
  get expiresAt(): number | null {
    this.init();
    return this._expiresAt;
  }

  /** Store a new access token and persist it. */
  set(token: string): void {
    this.init();
    this._token = token;
    this.storage?.setItem(ACCESS_KEY, token);
  }

  /** Store only a refresh token (used by the 2FA setup surface). */
  setRefreshToken(refreshToken: string): void {
    this.init();
    this._refreshToken = refreshToken;
    this.storage?.setItem(REFRESH_KEY, refreshToken);
  }

  /**
   * Persist a full session (access + refresh + expiry). `expires_in` is
   * in seconds and becomes an absolute epoch-ms deadline for the access
   * token. This is what login() and login2fa() call.
   */
  setSession(session: TokenSession): void {
    this.init();
    this._token = session.access_token;
    this.storage?.setItem(ACCESS_KEY, session.access_token);
    if (session.refresh_token !== undefined) {
      this._refreshToken = session.refresh_token;
      this.storage?.setItem(REFRESH_KEY, session.refresh_token);
    }
    if (session.expires_in !== undefined && session.expires_in > 0) {
      this._expiresAt = Date.now() + session.expires_in * 1000;
      this.storage?.setItem(EXPIRES_KEY, String(this._expiresAt));
    }
  }

  /**
   * Rotate to a new token pair (POST /auth/refresh). Replaces the access
   * token and optionally the refresh token; when no expiry is supplied the
   * previous deadline is kept (the mock refresh returns no expires_in).
   */
  refresh(session: TokenSession): void {
    this.init();
    this._token = session.access_token;
    this.storage?.setItem(ACCESS_KEY, session.access_token);
    if (session.refresh_token !== undefined) {
      this._refreshToken = session.refresh_token;
      this.storage?.setItem(REFRESH_KEY, session.refresh_token);
    }
    if (session.expires_in !== undefined && session.expires_in > 0) {
      this._expiresAt = Date.now() + session.expires_in * 1000;
      this.storage?.setItem(EXPIRES_KEY, String(this._expiresAt));
    }
  }

  /** Clear the whole session (access + refresh + expiry). */
  clear(): void {
    this.init();
    this._token = null;
    this._refreshToken = null;
    this._expiresAt = null;
    const s = this.storage;
    if (s) {
      s.removeItem(ACCESS_KEY);
      s.removeItem(REFRESH_KEY);
      s.removeItem(EXPIRES_KEY);
    }
  }

  /** True when an access token is present. */
  hasToken(): boolean {
    return this.token !== null;
  }

  /** True when a recorded access-token deadline has passed. */
  isExpired(now: number = Date.now()): boolean {
    this.init();
    return this._expiresAt !== null && now > this._expiresAt;
  }
}