---
name: npm-audit-clean
description: Use when scaffolding or upgrading any JavaScript or TypeScript project (Angular, React, Vue, Node, etc.) and writing or editing its package.json. Auto-runs `npm audit --omit=dev` and the build before claiming the scaffold shipped. Catches the recurring mistake of hand-typing version pins and missing the production-vs-dev vulnerability split.
---

# npm Audit Clean

## When to Use

- Scaffolding any new Node.js project.
- Editing `package.json` in any existing Node.js project.
- Upgrading any framework pin (Angular, React, Vue, etc.).
- Adding new dependencies to an existing project.
- Before claiming "scaffold complete" or "upgrade complete".
- Any time a project ships to production or shared with a team.

## When NOT to Use

- Brand-new project where no dependency tree exists yet (install first).
- Pure static HTML/CSS projects without a `package.json`.
- Docker images built from a frozen lock file (audit the lock, not the Dockerfile).

## The Mistake This Skill Prevents

The recurring mistake: write `package.json` by hand from memory, run `npm install` to verify it builds, declare success — without ever running `npm audit`. The build passes because semver is satisfied, but **build success is the wrong success criterion**. The right criterion is **fresh checkout + fresh install + audit clean + build clean**.

Hand-typed versions are often:
- Stale by several minor releases
- **Fabricated** (e.g. `tailwindcss@4.0.0` looked plausible but the real release was `4.3.3`; the package may not even exist at that version)
- Off the actual security-patched line

This happened in MERIDIAN on 2026-08-11 when the scaffold shipped with **104 npm audit vulnerabilities** (7 low, 53 moderate, 41 high, 3 critical) including production XSS in Angular itself. The user caught it. Fix was to bump to the latest compatible Angular 20 release, which the audit was already requesting.

## Process

1. **Install fresh.** Wipe `node_modules` and `package-lock.json`, then run `npm install`. This is non-negotiable: lockfile state hides what's actually being pulled in.

   ```bash
   rm -rf node_modules package-lock.json
   npm install --no-audit --no-fund
   ```

2. **Run the production audit first.** Production deps are what ships to users.

   ```bash
   npm audit --omit=dev
   ```

   The target is **zero vulnerabilities** in production. Anything else is a known risk that must be documented.

3. **Run the full audit (production + dev).**

   ```bash
   npm audit
   ```

   Dev-toolchain vulnerabilities are acceptable but should be listed explicitly. Format:

   ```
   Audit summary: 0 production / N dev (toolchain only)
   Dev vulnerabilities are in: <list of packages>
   Risk accepted: dev-only, never shipped to users.
   ```

4. **Build the app.**

   ```bash
   npm run build
   ```

   Production bundle must generate without warnings (treat warnings as errors in CI).

5. **Verify dependency versions actually exist.** Common failure mode: typing `5.6.0` because it "looks like a real version" when the real version is `5.7.2`. Before locking a pin:

   ```bash
   npm view <package> versions --json | tail -10
   ```

   Pick the highest published version in the compatible range. For framework major-version bumps, check the framework's own upgrade guide (Angular at https://angular.dev/upgrade, etc.) — major bumps have breaking changes.

6. **For dependencies with known CVEs, check the maintainer's security policy before bumping.** Some packages have a known policy of "no fixes, bump the major" — accept that or pick an alternative.

## Checklist

```
[ ] Fresh install (rm -rf node_modules package-lock.json, then npm install)
[ ] npm audit --omit=dev returns 0 vulnerabilities
[ ] npm audit (full) returns acceptable count for dev-only
[ ] npm run build exits 0 with no warnings
[ ] package-lock.json committed
[ ] Versions verified to actually exist on npm registry
[ ] If production audit was non-zero: bump major or document risk
[ ] If dev audit was non-zero: list the packages in handoff explicitly
```

## Output Format

Append to your handoff:

```
## npm audit (date)

Production: 0 vulnerabilities
Dev:        N vulnerabilities, all in [list of dev-only packages]
            Risk: dev toolchain only, never ships to users
Build:      ng build / npm run build exited 0

Major framework pins:
- Angular 20.3.27 (latest in v20 line)
- TypeScript 5.9.3 (compatible with Angular 20 peer >=5.8 <6.0)
- Tailwind CSS 4.3.3 (latest stable)
```

## Why This Skill Exists

The `npm install` exit code only checks that the dependency tree resolved. It does not check security advisories. The `ng build` exit code only checks that the bundler ran. Neither catches:

- Vulnerable transitive deps in production
- Vulnerable transitive deps in dev (acceptable but should be tracked)
- Fabricated version numbers that happen to satisfy semver
- Major version drift from security patches

A project that "builds clean" but ships with 100+ vulnerabilities is not a healthy scaffold. Running the audit before claiming done is the only verification that catches this.

## MERIDIAN Lesson Learned

The 2026-08-11 scaffold shipped with:
- `tailwindcss@4.0.0` (didn't exist; real latest is 4.3.3)
- `typescript@5.6.0` (didn't exist; real latest in compatible range is 5.7.2)
- `@angular/core@19.2.0` (latest in v19 was 19.2.25)
- Total: 104 audit vulns including production XSS

Fix: bumped all pins to verified-latest compatible versions, fresh-installed, confirmed 0 production vulns. Future feature packs must run the audit checklist above before declaring "feature complete" per AGENTS.md §7 rule 6 (Validate before claiming done).
