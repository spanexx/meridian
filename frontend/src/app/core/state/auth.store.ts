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

  /** Sign in. Persists the token on success; 2FA challenges pass through. */
  async login(email: string, password: string): Promise<LoginResult> {
    const result = await this.client.login(email, password);
    if ('access_token' in result) {
      this.tokenStore.set(result.access_token);
    }
    return result;
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

  /** End the session: drop the token and the cached member. */
  logout(): void {
    this.tokenStore.clear();
    this.member.set(null);
  }
}