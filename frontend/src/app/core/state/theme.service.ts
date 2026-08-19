/**
 * ThemeService — single owner of the app theme (dark/light).
 *
 * Pack B (2026-08-19): replaces the 6 copy-pasted 'meridian-theme'
 * implementations (app.ts boot apply, shell toggle, login/register/
 * landing page toggles, settings setTheme). Contract:
 *   - theme() signal — read in templates/components
 *   - toggle()  — flip dark <-> light (shell + auth-page buttons)
 *   - set(t)    — explicit theme (settings cards)
 *
 * Every change applies SYNCHRONOUSLY (document dataset + localStorage):
 * deliberately NOT an effect() — the boot path (App constructor) and
 * page toggles must apply before the next paint, and an unflushed
 * effect would also leak across TestBed instances in unit specs.
 * `applyTheme` is the single write path, shared by all three entries.
 *
 * Storage writes are try/catch'd: private-mode browsers can throw.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-19
 */
import { Injectable, signal } from '@angular/core';

/** localStorage key — kept identical to the 6 legacy implementations. */
export const THEME_STORAGE_KEY = 'meridian-theme';

export type ThemeKey = 'dark' | 'light';

function readInitialTheme(): ThemeKey {
  return typeof localStorage !== 'undefined' && localStorage.getItem(THEME_STORAGE_KEY) === 'light'
    ? 'light'
    : 'dark';
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<ThemeKey>(readInitialTheme());

  constructor() {
    // Boot path: apply the persisted theme immediately (App injects this
    // service in its constructor, before first paint).
    this.applyTheme(this.theme());
  }

  /** Single write path: signal <- document dataset <- localStorage. */
  private applyTheme(theme: ThemeKey): void {
    this.theme.set(theme);
    document.documentElement.dataset['theme'] = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* storage may be unavailable (private mode) — theme still applies */
    }
  }

  /** Flip dark <-> light (shell + auth page theme toggles). */
  toggle(): void {
    this.applyTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  /** Apply an explicit theme (settings theme cards). */
  set(theme: ThemeKey): void {
    this.applyTheme(theme);
  }
}