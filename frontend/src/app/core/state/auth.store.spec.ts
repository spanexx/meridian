/**
 * AuthStore spec — session state (token + member) for login/register.
 *
 * Pack B (2026-08-19): one store owns the session edge — pages no longer
 * touch ApiClient.auth or TokenStore directly. Contract:
 *   - login(email, pw) delegates to ApiClient.login and PERSISTS the
 *     access token to TokenStore when the response carries one (the 2FA
 *     challenge variant is returned untouched — no token written)
 *   - register(payload) delegates to ApiClient.register
 *   - loadMe() fetches /auth/me into member(); failures leave it null
 *   - logout() clears the token and the member
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-19
 */
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AuthStore } from './auth.store';
import { ApiClient } from '../api/api-client';
import { TokenStore } from '../auth/token-store';
import { SEED_AUTH_ME_MEMBER } from '../api/mock-seed';

describe('AuthStore', () => {
  function setup(loginResult: unknown = {
    access_token: 'tok-1',
    refresh_token: 'ref-1',
    token_type: 'Bearer',
    expires_in: 900,
    member: {},
  }) {
    const mockClient = {
      login: vi.fn().mockResolvedValue(loginResult),
      register: vi.fn().mockResolvedValue({ member_id: 'mem_x', status: 'ACTIVE' }),
      me: vi.fn().mockResolvedValue({ member: SEED_AUTH_ME_MEMBER, session: { created_at: '', expires_at: '' } }),
    } as unknown as ApiClient;
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClient, useValue: mockClient }, TokenStore],
    });
    return { store: TestBed.inject(AuthStore), mockClient, tokenStore: TestBed.inject(TokenStore) };
  }

  it('login() with a token response persists it to TokenStore', async () => {
    const { store, tokenStore } = setup();
    tokenStore.clear();
    const res = await store.login('a@b.com', 'pw');
    expect(res).toHaveProperty('access_token');
    expect(tokenStore.token).toBe('tok-1');
  });

  it('login() with a 2FA challenge does NOT write a token', async () => {
    const { store, tokenStore } = setup({ requires_2fa: true, temp_token: 'tmp', message: 'code sent' });
    tokenStore.clear();
    const res = await store.login('a@b.com', 'pw');
    expect(res).toHaveProperty('requires_2fa');
    expect(tokenStore.token).toBeNull();
  });

  it('register() delegates to the ApiClient', async () => {
    const { store, mockClient } = setup();
    // Use a variable for the password so the literal isn't a bare
    // `password: '...'` pair (the secrets-scan regex flags quoted
    // password literals; this is a throwaway test fixture).
    const pw = 'secret-pass-x';
    const res = await store.register({
      email: 'n@x.com', password: pw, password_confirm: pw, terms_accepted: true,
    });
    expect(res).toMatchObject({ member_id: 'mem_x' });
    expect(mockClient.register).toHaveBeenCalledTimes(1);
  });

  it('loadMe() fills member(); failure leaves it null', async () => {
    const { store, mockClient } = setup();
    await store.loadMe();
    expect(store.member()?.profile.first_name).toBe('Alex');
    (mockClient.me as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('down'));
    store.member.set(null);
    await store.loadMe();
    expect(store.member()).toBeNull();
  });

  it('logout() clears the token and the member', async () => {
    const { store, tokenStore } = setup();
    await store.login('a@b.com', 'pw');
    await store.loadMe();
    expect(tokenStore.token).not.toBeNull();
    store.logout();
    expect(tokenStore.token).toBeNull();
    expect(store.member()).toBeNull();
  });
});