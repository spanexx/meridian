---
topic: tooling
severity: low
---

# vite 7 vs 8 placeholder mismatch (Angular dev server)

**One-line**: when `@angular/build@20.x` runs `vite@7.x` as its dev server, the bundled vite client expects `__SERVER_FORWARD_CONSOLE__` (a vite 8.x convention) but the angular builder skips the substitution, throwing `ReferenceError: __SERVER_FORWARD_CONSOLE__ is not defined` in the browser console on every page load.

## The trap

After adding the `<ui-shell>` sidebar (PR #12), Chrome dev-tools shows this on every page load:

```
client:865 Uncaught ReferenceError: __SERVER_FORWARD_CONSOLE__ is not defined
    at client:865:24
```

But the app still renders correctly. This is a dev-only warning from vite's `@vite/client` bundle (yes, it's THE vite HMR client — every Angular dev server bundles it).

## Why this matters

- it's noisy — every page load logs the error
- it makes you chase non-bugs ("did my shell code break something?")
- it's actually a vite ↔ @angular/build version mismatch, not anything in your code

## Root cause

`@analogjs/vite-plugin-angular@2.6.4` brings vite `8.2.1` (used by vitest). `@angular/build@20.3.33` brings vite `7.3.6` (used by the dev server). npm dedupes to satisfy both — vite 8.x is on disk, but vite 7.x is the dev server's actual runtime.

The placeholder `__SERVER_FORWARD_CONSOLE__` is a vite 8.x feature (forward browser console messages to the terminal via HMR). vite 7.x's bundled client reads the symbol at startup; the angular builder's runtime doesn't substitute it, so `forwardConsole` is undefined → `setupForwardConsoleHandler(undefined)` throws → uncaught error.

## The fix (cosmetic, no functional impact)

Pre-define the symbol in `src/index.html`:

```html
<script>window.__SERVER_FORWARD_CONSOLE__ = { enabled: false };</script>
```

placed BEFORE `<app-root>`. Production builds don't include the `@vite/client` bundle, so this has zero effect in prod.

## Why I chose option D (polyfill) over option C (ignore)

Option C: just live with the error. Tempting — the app works. But every future agent that opens Chrome dev-tools will waste time chasing this. Adding one line kills the noise permanently.

Options A/B considered and rejected:
- A: pass a flag to `ng serve` disabling HMR console forwarding. No such flag exists on Angular 20.
- B: patch vite itself. Breaks on the next npm install.

## How to detect this in the future

Symptom: every page load logs `Uncaught ReferenceError: __SERVER_FORWARD_CONSOLE__ is not defined` exactly once. The app still renders. Look in the source of any `node_modules/vite/dist/client/client.mjs` for `__SERVER_FORWARD_CONSOLE__` — if the placeholder is there but the dev server doesn't substitute it, you have this bug.

## Real example from this session

PR #12 landed the sidebar shell. Chrome devtools showed the error on every page reload. After 30 seconds of "did I break the shell?", checked `@angular/build`'s vite client and confirmed this is a vite 7/8 mismatch. Added the polyfill. Error gone.

## Related

- ANGULAR builder deps: `@angular/build@20.3.33` → vite@7.3.6
- vitest deps: `@analogjs/vitest-angular@2.6.4` → vite@8.2.1
- npm dedupe keeps both versions on disk; the dev server picks vite 7
