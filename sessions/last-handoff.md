# MERIDIAN — Session Handoff (2026-08-18)

## Soul
This session was about proving the frontend could someday talk to a real
backend without a rewrite — and finding out, honestly, that it mostly can't
yet. We started by finishing the data layer (payouts page rewired, transport
seam closed), fixed a small but real mobile sidebar bug that bit the user on
their phone, then ran a cold audit of how ready the frontend is to flip from
mock data to a live database. The mood was pragmatic: ship the pieces that are
done, name the gap precisely, and hand the next agent a clean map instead of a
vague "almost there."

## What We Did
We closed out the frontend data layer by rewiring the payouts page to inject
the single `ApiClient` and deleting its old hardcoded data file, then wired
`app.config.ts` so that the mock transport (dev) and the HTTP transport (prod)
are chosen in exactly one place — the only switch point that will ever matter.
After the user spotted the sidebar's action buttons requiring a scroll on a
short phone screen, we pinned the bottom row so only the nav scrolls, and
confirmed it live on their device at the running dev server. The centerpiece
was a read-only audit (delegate cline-one job 7) asking the blunt question:
if we implement the backend tomorrow, is flipping the data source the only
change needed? The answer was no, and we documented exactly why.

## What We Found
The transport seam is genuinely correct — only `app.config.ts` decides mock
versus HTTP, and flipping the `useMock` flag is the entire switch; no page
touches a transport directly, and `HttpTransport` already reads a backend URL,
attaches a Bearer token, and unwraps the same envelope the mock returns. The
real exposure is the data wiring: only the payouts page actually injects
`ApiClient`. Every other page — dashboard, opportunities, executions,
communities, profile, notifications, pool, and the auth flows — renders
hardcoded wireframe fixtures from local consts, so a backend flip would leave
them frozen on fake data while only payouts went live. Worse, five `ApiClient`
methods (executions, execution detail, pool-wide payouts, member payouts, and
notifications) have no backend contract in `docs/apis/`, meaning they would
404 the moment the switch happened, and the auth token provider is still a stub
returning null. One uncommitted expansion of `api-client.spec.ts` (new test
coverage for the typed surface) was found in the tree and needs a commit
decision.

## How to Continue
Start the next session by running `situ` and reading this handoff plus
`sessions/decisions.md`. The headline is that the infrastructure for a clean
backend switch exists but the page-level wiring does not — treat "flip one
config = done" as blocked until roughly fourteen pages are rewired to
`ApiClient` and five API contracts are written in `docs/apis/`. That is a
large, multi-session effort, so do not improvise it: let the user trigger
`wayfinder` or approve a plan first, per the plan-first rule. Resolve the
dangling `api-client.spec.ts` change as its own commit. Honor AUTO mode (the
`state` file is `auto`) but remember AUTO only lets you decide how, never what
— scope and economics still belong to the user. Kill the resident dev server
(proc_3a3f25c5e0d0) if it is still alive, and re-run the verification trio
(tsc, vitest, the payouts e2e) before any PR.
