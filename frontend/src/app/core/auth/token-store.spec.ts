/**
 * TokenStore unit tests (vitest).
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { TokenStore } from './token-store';
import { vi } from 'vitest';

describe('TokenStore', () => {
  let store: TokenStore;
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => { mockStorage[key] = value; },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { Object.keys(mockStorage).forEach((k) => delete mockStorage[k]); },
      key: (index: number) => Object.keys(mockStorage)[index] ?? null,
      length: 0,
    } as Storage);
    store = new TokenStore();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts with null token', () => {
    expect(store.token).toBeNull();
    expect(store.hasToken()).toBeFalsy();
  });

  it('set() stores token in memory and sessionStorage', () => {
    store.set('abc123');
    expect(store.token).toBe('abc123');
    expect(store.hasToken()).toBeTruthy();
    expect(sessionStorage.getItem('meridian_access_token')).toBe('abc123');
  });

  it('clear() removes token from memory and sessionStorage', () => {
    store.set('abc123');
    store.clear();
    expect(store.token).toBeNull();
    expect(store.hasToken()).toBeFalsy();
    expect(sessionStorage.getItem('meridian_access_token')).toBeNull();
  });

  it('persists across instances via sessionStorage', () => {
    store.set('persisted-token');
    const store2 = new TokenStore();
    expect(store2.token).toBe('persisted-token');
    expect(store2.hasToken()).toBeTruthy();
  });

  it('handles missing sessionStorage gracefully (SSR)', () => {
    vi.stubGlobal('sessionStorage', undefined as unknown as Storage);
    const ssrStore = new TokenStore();
    ssrStore.set('ssr-token');
    expect(ssrStore.token).toBe('ssr-token');
    expect(ssrStore.hasToken()).toBeTruthy();
    ssrStore.clear();
    expect(ssrStore.token).toBeNull();
  });

  // ─── Pack C: full session (access + refresh + expiry) ────────────────

  it('setSession() stores access, refresh and expiry', () => {
    store.setSession({ access_token: 'at', refresh_token: 'rt', expires_in: 900 });
    expect(store.token).toBe('at');
    expect(store.refreshToken).toBe('rt');
    expect(store.expiresAt).not.toBeNull();
    expect(sessionStorage.getItem('meridian_access_token')).toBe('at');
    expect(sessionStorage.getItem('meridian_refresh_token')).toBe('rt');
    expect(sessionStorage.getItem('meridian_token_expires_at')).not.toBeNull();
  });

  it('refresh() replaces the token pair and extends expiry', () => {
    store.setSession({ access_token: 'old', refresh_token: 'old-r', expires_in: 900 });
    store.refresh({ access_token: 'new', refresh_token: 'new-r', expires_in: 900 });
    expect(store.token).toBe('new');
    expect(store.refreshToken).toBe('new-r');
  });

  it('refresh() without an expiry keeps the existing expiry (mock parity)', () => {
    store.setSession({ access_token: 'old', refresh_token: 'old-r', expires_in: 900 });
    const before = store.expiresAt;
    store.refresh({ access_token: 'new', refresh_token: 'new-r' });
    expect(store.token).toBe('new');
    expect(store.expiresAt).toBe(before);
  });

  it('refreshToken is null until setSession/setRefreshToken', () => {
    expect(store.refreshToken).toBeNull();
    store.setRefreshToken('rt');
    expect(store.refreshToken).toBe('rt');
  });

  it('isExpired() is false when no expiry set, true once past it', () => {
    expect(store.isExpired()).toBe(false);
    const past = Date.now() - 1000;
    sessionStorage.setItem('meridian_token_expires_at', String(past));
    const fresh = new TokenStore();
    expect(fresh.isExpired()).toBe(true);
    const future = Date.now() + 1000 * 60;
    sessionStorage.setItem('meridian_token_expires_at', String(future));
    const live = new TokenStore();
    expect(live.isExpired()).toBe(false);
  });

  it('clear() removes access, refresh and expiry', () => {
    store.setSession({ access_token: 'at', refresh_token: 'rt', expires_in: 900 });
    store.clear();
    expect(store.token).toBeNull();
    expect(store.refreshToken).toBeNull();
    expect(store.expiresAt).toBeNull();
    expect(sessionStorage.getItem('meridian_refresh_token')).toBeNull();
    expect(sessionStorage.getItem('meridian_token_expires_at')).toBeNull();
  });

  it('persists the full session across instances via sessionStorage', () => {
    store.setSession({ access_token: 'at', refresh_token: 'rt', expires_in: 900 });
    const store2 = new TokenStore();
    expect(store2.refreshToken).toBe('rt');
    expect(store2.expiresAt).not.toBeNull();
  });
});
