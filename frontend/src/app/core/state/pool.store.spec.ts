/**
 * PoolStore spec — shared pool state (status + member balance).
 *
 * Pack B (2026-08-19): one store serves the pool page AND the dashboard
 * KPI row (both render poolStatus totals) plus the withdraw modal
 * balance. Contract:
 *   - load() fetches status + balance from the injected ApiClient
 *     (parallel, both resolve or the store stays on prior values)
 *   - status() / balance() signals null until the first load resolves
 *   - loading() true until both land
 *   - concurrent load() calls share ONE request (no duplicate fetches)
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-19
 */
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { PoolStore } from './pool.store';
import { ApiClient } from '../api/api-client';
import { SEED_BALANCE, SEED_POOL_STATUS } from '../api/mock-seed';

describe('PoolStore', () => {
  function setup(poolStatus = SEED_POOL_STATUS, balance = SEED_BALANCE) {
    const mockClient = {
      poolStatus: vi.fn().mockResolvedValue(poolStatus),
      balance: vi.fn().mockResolvedValue(balance),
    } as unknown as ApiClient;
    TestBed.configureTestingModule({ providers: [{ provide: ApiClient, useValue: mockClient }] });
    return { store: TestBed.inject(PoolStore), mockClient };
  }

  it('starts in the loading state with null values', () => {
    const { store } = setup();
    expect(store.loading()).toBe(true);
    expect(store.status()).toBeNull();
    expect(store.balance()).toBeNull();
  });

  it('load() resolves status + balance and clears loading', async () => {
    const { store, mockClient } = setup();
    await store.load();
    expect(store.loading()).toBe(false);
    expect(store.status()).toEqual(SEED_POOL_STATUS);
    expect(store.balance()).toEqual(SEED_BALANCE);
    expect(mockClient.poolStatus).toHaveBeenCalledTimes(1);
    expect(mockClient.balance).toHaveBeenCalledTimes(1);
  });

  it('concurrent load() calls share a single request pair', async () => {
    const { store, mockClient } = setup();
    const a = store.load();
    const b = store.load();
    await Promise.all([a, b]);
    expect(mockClient.poolStatus).toHaveBeenCalledTimes(1);
    expect(mockClient.balance).toHaveBeenCalledTimes(1);
  });

  it('a rejected fetch leaves loading false and prior values intact', async () => {
    const { store } = setup();
    await store.load();
    const before = store.status();
    (TestBed.inject(ApiClient) as unknown as { poolStatus: ReturnType<typeof vi.fn> }).poolStatus.mockRejectedValue(
      new Error('down'),
    );
    await store.load();
    expect(store.loading()).toBe(false);
    expect(store.status()).toBe(before);
  });
});