/**
 * ThemeService spec — single owner of the app theme (dark/light).
 *
 * Pins (Pack B, 2026-08-19): one service replaces the 6 copy-pasted
 * 'meridian-theme' implementations (app.ts boot, shell, login, register,
 * landing, settings). Contract:
 *   - theme() initializes from localStorage (default 'dark')
 *   - toggle() flips dark <-> light
 *   - set(theme) applies an explicit theme
 *   - every change persists to localStorage AND applies to
 *     document.documentElement.dataset.theme (first paint boot included)
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-19
 */
import { TestBed } from '@angular/core/testing';
import { ThemeService, THEME_STORAGE_KEY } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
  });

  function service(): ThemeService {
    return TestBed.inject(ThemeService);
  }

  it('defaults to dark when nothing is persisted', () => {
    expect(service().theme()).toBe('dark');
  });

  it('initializes from the persisted value', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    expect(service().theme()).toBe('light');
  });

  it('applies the persisted theme to the document on creation (boot path)', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    service();
    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('toggle() flips dark -> light -> dark and persists + applies each time', () => {
    const s = service();
    s.toggle();
    expect(s.theme()).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement.dataset['theme']).toBe('light');
    s.toggle();
    expect(s.theme()).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('set() applies an explicit theme (settings page path)', () => {
    const s = service();
    s.set('light');
    expect(s.theme()).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement.dataset['theme']).toBe('light');
  });
});
