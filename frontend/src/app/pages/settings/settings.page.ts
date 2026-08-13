/**
 * SettingsPageComponent — the signed-in user's own settings page.
 *
 * Renders per wireframe/meridian/settings/index.html:
 *   - page header
 *   - 4-tab switcher: Profile | Security | Notifications | Appearance
 *   - one panel visible at a time (controlled by `activeTab`)
 *
 * All form submissions are placeholders for now (production: route to a
 * service). The `setTheme()` action is real — it mutates the
 * `data-theme` attribute on document.documentElement, matching the
 * shell's theme toggle behaviour.
 *
 * @owner   spanexx
 * @reviewed 2026-08-13
 */
import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { UiIconComponent } from '../../ui/icon/icon.component';

type TabKey = 'profile' | 'security' | 'notifications' | 'appearance';
type ThemeKey = 'light' | 'dark';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [UiIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.template.html',
})
export class SettingsPageComponent {
  /** Currently active tab (which panel is visible). */
  readonly activeTab = signal<TabKey>('profile');

  /** Current theme (used to highlight the matching theme card). */
  readonly currentTheme = signal<ThemeKey>(
    (document.documentElement.getAttribute('data-theme') as ThemeKey) ?? 'dark',
  );

  /** Static current-user fields (placeholder). Production: inject a service. */
  readonly user = {
    firstName: 'Alex',
    lastName: 'Chen',
    displayName: 'Alex Chen',
    bio: 'Operator & signal contributor. Based in SF.',
    initials: 'AC',
  };

  /** Digest frequency options for the Notifications panel. */
  readonly digestFrequencies = ['Daily (9:00)', 'Weekly (Mon 9:00)', 'Off'] as const;
  readonly digestFrequency = signal<string>('Daily (9:00)');

  /** 2FA enabled state (placeholder). */
  readonly twoFactorEnabled = signal<boolean>(true);

  /** Notification toggles (placeholder). */
  readonly notifInApp = signal<boolean>(true);
  readonly notifEmail = signal<boolean>(true);
  readonly notifPush  = signal<boolean>(false);

  /** Compact tables toggle (placeholder). */
  readonly compactTables = signal<boolean>(false);

  /** Theme-card lookup helper. */
  isThemeCurrent(theme: ThemeKey): boolean {
    return this.currentTheme() === theme;
  }

  /** Switch the active tab. */
  selectTab(tab: TabKey): void {
    this.activeTab.set(tab);
  }

  /** Apply the chosen theme (mutates document.documentElement). */
  setTheme(theme: ThemeKey): void {
    this.currentTheme.set(theme);
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('meridian-theme', theme);
    } catch {
      /* storage may be unavailable in private-mode browsers */
    }
  }

  /** Toggle helpers (each inverts the current signal value). */
  toggle2FA(): void {
    this.twoFactorEnabled.set(!this.twoFactorEnabled());
  }
  toggleNotifInApp(): void {
    this.notifInApp.set(!this.notifInApp());
  }
  toggleNotifEmail(): void {
    this.notifEmail.set(!this.notifEmail());
  }
  toggleNotifPush(): void {
    this.notifPush.set(!this.notifPush());
  }
  toggleCompactTables(): void {
    this.compactTables.set(!this.compactTables());
  }

  /** Placeholder form-action handlers. Production: validate + route to a service. */
  saveProfile(): true {
    return true;
  }
  savePassword(): true {
    return true;
  }
  signOutOthers(): true {
    return true;
  }
}
