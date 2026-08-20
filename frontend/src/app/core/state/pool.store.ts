/**
 * PoolStore — shared pool state (status + member balance).
 *
 * Pack B (2026-08-19): both the pool page and the dashboard KPI row
 * render poolStatus() totals, and the pool withdraw modal shows the
 * member balance — one store serves all three, so a single load()
 * populates both pages without duplicate fetches. Pages read the
 * signals; they never call ApiClient.poolStatus/balance themselves.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-19
 */
import { Injectable, inject, signal } from '@angular/core';
import { ApiClient } from '../api/api-client';
import type { BalanceInfo, PoolStatus } from '../models';

@Injectable({ providedIn: 'root' })
export class PoolStore {
  private readonly client = inject(ApiClient);

  /** Pool KPIs/health (null until the first load resolves). */
  readonly status = signal<PoolStatus | null>(null);

  /** Member-level available balance (withdraw modal edge). */
  readonly balance = signal<BalanceInfo | null>(null);

  /** True until the first load lands (drives skeletons/empty states). */
  readonly loading = signal(true);

  /** In-flight dedupe: concurrent load() calls share one request pair. */
  private inflight: Promise<void> | null = null;

  /** Fetch status + balance in parallel. Safe to call from any page. */
  load(): Promise<void> {
    if (this.inflight) return this.inflight;
    this.inflight = Promise.all([
      this.client.poolStatus().catch(() => null),
      this.client.balance().catch(() => null),
    ])
      .then(([status, balance]) => {
        if (status) this.status.set(status);
        if (balance) this.balance.set(balance);
        this.loading.set(false);
      })
      .finally(() => {
        this.inflight = null;
      });
    return this.inflight;
  }
}