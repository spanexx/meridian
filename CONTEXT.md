# CONTEXT.md — MERIDIAN Canonical Terms

This file is the canonical glossary for MERIDIAN. GRILL sessions and docs reference these terms by name — never re-ask about terms already defined here. When new canonical terms emerge, record them here first (AGENTS.md §4).

## Architecture Terms

### Kernel
The tiny, domain-blind core: receives events, dispatches work, coordinates execution, records execution. Contains no business logic and knows no domain.

### Engine
A capability owner (Identity & Access, Member, Money, Opportunity, Execution, Payout, Reputation, Notification, Admin). Engines own their data; they never call each other — they publish facts and react to facts.

### Provider
External technology behind a contract (PaymentProvider, MarketplaceProvider, NotificationProvider, StorageProvider, RecommenderProvider). Swapping a provider = adding an adapter, never editing an engine.

### Contract
The stable interface an engine or provider exposes: what can be requested, what can be returned, what errors exist, what guarantees are provided. Everything else is private.

### Event
A recorded fact (`opportunity.approved`, `execution.funded`); the kernel's only data. Engines publish facts; they do not command other components.

## Principles

The engineering philosophy this architecture is built on (details in `docs/01-architecture.md`):

- Replaceability first — every component is temporary behind its interface
- Tiny kernel — the center stays boring and domain-blind
- Capabilities, not features — providers behind contracts, never privileged technology
- Dependencies point inward — inner layers never know outer layers exist
- Complexity lives at the edge — engines and provider adapters carry it
- Observability is mandatory — every event recorded, every action traceable
- AI recommends; humans decide — automated checks never make final calls

## Governance Terms

### Community
The members of a MERIDIAN pool. v1 runs one Community (one pool); the governance model is generic so more can be added later without redesign.

### Community-Governed Parameter
An economic target or threshold decided by the Community through a Governance Vote — never set centrally: ROI floor, win-rate target, distribution shares, reserve ratio target, vetting rules, single-execution cap. Safety rails (integrity, reconciliation, no-ponzi, human control) are never Community-Governed.

### Governance Vote
The reputation-weighted vote by which the Community sets a Community-Governed Parameter. Any member may propose; members with vetting privileges (VETTER+) vote; weight comes from reputation (`vetting_weight`). Proposals may be suggested by the RecommenderProvider, but it never decides. Results apply to future executions only — never retroactively.
