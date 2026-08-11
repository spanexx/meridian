# MERIDIAN — Goal Analysis

## Problem

Arbitrage opportunities are gated by three resources — **capital**, **information** (signals), and **access** (licenses, accounts, locations, presence). An individual rarely holds all three at once. MERIDIAN pools all three so deals happen that no single member could execute alone.

## Mission

Pool capital, signals, and access so members profit from real arbitrage that none could execute alone.

## Objectives

### O1. Integrity is non-negotiable (central — never community-voted)
- Daily reconciliation always `BALANCED`; every dollar accounted (docs/money/01-pool-accounting.md)
- Every execution reconstructable from the event stream (docs/02-data-model.md, `events`)
- No obligation to pay unearned returns — no ponzi mechanics, ever
- KYC, PII segregation, audit trails (docs/00-system-overview.md, Security Model)

### O2. Real economic returns (community-governed targets)
- Executions are profitable on average — the ROI floor is set by the Community, not the platform
- Win-rate (profitable / completed executions) is tracked and reported; its target is set by the Community
- Deployment ratio stays inside the safety band 20–40%, max 50% (central safety rail)

### O3. Fair, meritocratic distribution
- Splits paid per the formula in docs/money/02-profit-distribution.md; shares may be adjusted only through a Governance Vote, never unilaterally
- Signal accuracy drives reputation; bad signals get throttled (Reputation engine)

### O4. Healthy pool (central safety rails; targets community-governed)
- Reserve ratio never below the safety minimums: warn < 10%, critical < 5% (money/01)
- Liquidity ratio never below 30%; healthy ≥ 50% (money/01)
- Above the safety minimums, the Community may set its own reserve target

### O5. Growth from performance, not recruitment
- Growth measured by profit and opportunity flow, not member count
- No rewards for recruiting (Core Principle 5)

---

## Community-Governed Parameters

The Community decides the economic targets. The platform never sets them unilaterally — including in AUTO mode, where money/economics rules stay with the user and the Community.

**What the Community decides (via Governance Vote):**
- ROI floor (e.g. 15% — proposed, never assumed)
- Win-rate target
- Distribution shares (capital / signal / access / operations / platform)
- Reserve ratio target (above the central safety minimums)
- Vetting thresholds (votes required, timeouts)
- Single-execution cap

**Mechanism (v1, aligned with the existing vetting model):**
1. Any member may propose a parameter change
2. Members with vetting privileges (VETTER+) vote; votes are reputation-weighted (`vetting_weight` from `reputation_scores`)
3. The RecommenderProvider may suggest values — it never decides (AI recommends; humans decide)
4. The decision is recorded with provenance on the config entry: proposer, decision date, vote tally
5. Results apply to future executions only — never retroactively

**Safety rails that are NEVER community-voted:**
- Reconciliation, audit, event stream (integrity)
- No-ponzi / no unearned returns
- Human control over money and reputation
- KYC and identity rules
- Technical architecture (kernel / engines / providers)

---

## Priority Order — the AUTO Compass

When a decision is not directly answered by the docs, choose the option that best serves, in order:

1. **Integrity** — auditability, reconciliation, no unearned returns
2. **Real returns** — above the Community's floor, win-rate healthy
3. **Fair distribution** — locked formula, meritocracy
4. **Pool health** — reserve and liquidity safety rails
5. **Performance-driven growth** — profit and opportunity flow

AUTO decisions cite the objective they serve in `sessions/decisions.md`.

---

## Non-Goals (explicitly out)

- Deposit-based returns / ponzi mechanics
- Recruitment incentives
- Black-box accounting
- Automated final calls on money or reputation
- Community-voted safety rails (integrity is not negotiable)

---

## v1 Scope: One Community

v1 runs **one Community, one pool** (the docs describe a single pool). The governance model is defined generically — proposer + reputation-weighted vote + provenance record — so additional Communities can be added later as a configuration-level change, not an architectural one (delay complexity; reversible decision).
