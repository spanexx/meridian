/**
 * AuthStore — session state (token + member) for the auth edge.
 *
 * Pack B (2026-08-19): pages no longer touch ApiClient.auth or
 * TokenStore directly — login/register/loadMe/logout live here. The
 * token is persisted to TokenStore (the interceptor's source), the
 * member profile is memoized for shell/header consumption, and the 2FA
 * challenge variant is returned untouched (the page owns the challenge
 * UI; Pack C).
 *
 * Pack C (2026-08-19): the store now owns the full session — login
 * persists access + refresh + expiry, and login2fa / refresh / logout
 * (server + local) live here. `isAuthenticated()` is the guard's single
 * source for "does a live session exist".
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-19
 */
import { Injectable, inject, signal } from '@angular/core';
import { ApiClient } from '../api/api-client';
import { TokenStore } from '../auth/token-store';
import type { AuthMeMember, LoginResponse, RegisterResponse, TwoFactorChallenge } from '../models';

export type LoginResult = LoginResponse | TwoFactorChallenge;

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly client = inject(ApiClient);
  private readonly tokenStore = inject(TokenStore);

  /** Signed-in member profile (null until loadMe() resolves). */
  readonly member = signal<AuthMeMember | null>(null);

  /** Sign in. Persists the full session on success; 2FA challenges pass through. */
  async login(email: string, password: string): Promise<LoginResult> {
    const result = await this.client.login(email, password);
    if ('access_token' in result) {
      this.tokenStore.setSession(result);
    }
    return result;
  }

  /** Complete a 2FA-required sign-in: persist the token pair + load the member. */
  async login2fa(tempToken: string, code: string): Promise<void> {
    const session = await this.client.login2fa(tempToken, code);
    this.tokenStore.setSession(session);
    await this.loadMe();
  }

  /** Create an account. */
  register(payload: {
    email: string;
    password: string;
    password_confirm: string;
    terms_accepted: boolean;
  }): Promise<RegisterResponse> {
    return this.client.register(payload);
  }

  /** Refresh the member profile from /auth/me. Failures leave member null. */
  async loadMe(): Promise<void> {
    try {
      const { member } = await this.client.me();
      this.member.set(member);
    } catch {
      this.member.set(null);
    }
  }

  /**
   * Rotate the token pair via POST /auth/refresh. Returns true on
   * success; on failure (or when no refresh token exists) clears the
   * session + member and returns false so a 401-retry flow can bail.
   */
  async refresh(): Promise<boolean> {
    const refreshToken = this.tokenStore.refreshToken;
    if (!refreshToken) {
      this.clearSession();
      return false;
    }
    try {
      const session = await this.client.refresh(refreshToken);
      this.tokenStore.setSession(session);
      return true;
    } catch {
      this.clearSession();
      return false;
    }
  }

  /** End the session: revoke server-side (best-effort) + clear locally. */
  async logout(): Promise<void> {
    try {
      await this.client.logout();
    } catch {
      // Local logout still proceeds server-side is unreachable (offline).
    }
    this.clearSession();
  }

  /** True when a live access token exists (or one with no recorded expiry). */
  isAuthenticated(): boolean {
    return this.tokenStore.hasToken() && !this.tokenStore.isExpired();
  }

  private clearSession(): void {
    this.tokenStore.clear();
    this.member.set(null);
  }
}