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
});
