/**
 * ShellComponent — the layout chrome wrapping every routed page.
 *
 * Renders per wireframe/meridian/kit/app.js mountShell().
 *
 * Layout:
 *   .app-shell
 *     .mobile-bar          (mobile only, hidden >= 1280px)
 *     .sidebar-backdrop    (mobile only)
 *     aside.sidebar        (260px fixed left, all sizes)
 *       MERIDIAN brand + tagline
 *       nav-section: Platform
 *       nav-section: Community
 *       nav-section: Account
 *       nav-section: Quick Actions
 *       bottom-row: notifications / theme toggle / avatar menu
 *     main.main
 *       <ng-content>       (the routed page renders here)
 *
 * @owner   spanexx
 * @reviewed 2026-08-11
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { UiIconComponent } from '../ui/icon/icon.component';

/**
 * The navigation map mirrors wireframe/meridian/kit/app.js NAV.
 * 11 entries across Platform / Community / Account sections + the
 * Quick Actions block (Submit Signal) which is rendered separately.
 */
export interface NavItem {
  label: string;
  icon: string;
  path: string;
  section: 'Platform' | 'Community' | 'Account';
}

export const ANGULAR_NAV_ITEMS: readonly NavItem[] = Object.freeze([
  { label: 'Dashboard',     icon: 'layout-dashboard',   path: '/dashboard',     section: 'Platform' },
  { label: 'Opportunities', icon: 'lightbulb',          path: '/opportunities', section: 'Platform' },
  { label: 'Executions',    icon: 'zap',                path: '/executions',    section: 'Platform' },
  { label: 'Capital Pool',  icon: 'banknote',           path: '/pool',          section: 'Platform' },
  { label: 'Communities',   icon: 'users',              path: '/communities',   section: 'Community' },
  { label: 'Members',       icon: 'user',               path: '/members',       section: 'Community' },
  { label: 'Governance',    icon: 'vote',               path: '/governance',    section: 'Community' },
  { label: 'Payouts',       icon: 'circle-dollar-sign', path: '/payouts',       section: 'Community' },
  { label: 'Notifications', icon: 'bell',               path: '/notifications', section: 'Account' },
  { label: 'Settings',      icon: 'settings',           path: '/settings',      section: 'Account' },
  { label: 'Your Profile',  icon: 'user',               path: '/profile',       section: 'Account' },
] as const);

@Component({
  selector: 'ui-shell',
  standalone: true,
  imports: [RouterLink, UiIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-shell" data-testid="shell">
      <!-- Mobile top bar (hidden >= 1280px via .mobile-bar CSS) -->
      <div class="mobile-bar">
        <button type="button" class="icon-btn" data-sidebar-toggle aria-label="Open menu">
          <ui-icon name="menu"></ui-icon>
        </button>
        <a routerLink="/" class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-md flex items-center justify-center" style="background: var(--gradient-violet);">
            <ui-icon name="diamond" class="text-white" [size]="14"></ui-icon>
          </div>
          <span class="text-sm font-semibold tracking-tight">MERIDIAN</span>
        </a>
        <button type="button" class="icon-btn" data-theme-toggle aria-label="Toggle theme">
          <ui-icon name="moon"></ui-icon>
        </button>
      </div>

      <!-- Mobile backdrop -->
      <div class="sidebar-backdrop" hidden data-sidebar-backdrop></div>

      <!-- The actual sidebar — 260px wide, fixed left, full height -->
      <aside class="sidebar" data-testid="sidebar">
        <a routerLink="/" class="flex items-center gap-2.5 mb-2 px-2">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: var(--gradient-violet);">
            <ui-icon name="diamond" class="text-white" [size]="16"></ui-icon>
          </div>
          <div>
            <div class="text-sm font-semibold tracking-tight">MERIDIAN</div>
            <div class="text-[10px] uppercase tracking-widest text-slate-500">Collective Arbitrage</div>
          </div>
        </a>

        <!-- Group nav by section, render each -->
        @for (grp of sectionedItems(); track grp.section) {
          <div class="nav-section">{{ grp.section }}</div>
          @for (it of grp.items; track it.label) {
            <a
              [routerLink]="it.path"
              class="nav-item"
              [class.active]="isActive(it.path)"
              [attr.data-nav]="it.path"
            >
              <ui-icon [name]="it.icon"></ui-icon>
              {{ it.label }}
            </a>
          }
        }

        <!-- Quick Actions — separate from the grouped nav -->
        <div class="nav-section">Quick Actions</div>
        <a routerLink="/submit-signal" class="nav-item" data-testid="submit-signal">
          <ui-icon name="plus-circle"></ui-icon>
          Submit Signal
        </a>

        <!-- Bottom-row: notifications / theme / avatar menu -->
        <div class="mt-auto pt-4 border-t" style="border-color: var(--border-subtle);">
          <div class="flex items-center justify-around px-2 py-1.5">
            <button type="button" class="icon-btn" data-dropdown="notifMenu" title="Notifications">
              <ui-icon name="bell"></ui-icon>
            </button>
            <button type="button" class="icon-btn" data-theme-toggle title="Toggle theme">
              <ui-icon name="moon"></ui-icon>
            </button>
            <button type="button" class="icon-btn" data-dropdown="avatarMenu" title="Account">
              <ui-icon name="user"></ui-icon>
            </button>
          </div>
          <a routerLink="/profile" class="nav-item mt-1">
            <div class="avatar" style="background: var(--gradient-violet);">AC</div>
            <div class="flex-1 min-w-0">
              <div class="text-sm text-slate-100 truncate">Alex Chen</div>
              <div class="text-[10px] uppercase tracking-wider text-violet-300">Vetter · T3</div>
            </div>
          </a>
        </div>
      </aside>

      <!-- Routed page content -->
      <main class="main" data-testid="shell-main">
        <ng-content></ng-content>
      </main>
    </div>
  `,
  styles: [':host { display: contents; }'],
})
export class ShellComponent {
  private readonly router = inject(Router);

  /**
   * URL of the currently active route, derived from Router.events. Pages
   * that need this value can ask; we don't take it as input here because
   * the shell already has the Router handle.
   */
  readonly currentUrl = toSignal(
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)),
    { initialValue: null as unknown as NavigationEnd },
  );

  /** Builds the section-grouped nav list. */
  readonly sectionedItems = computed(() => {
    const groups: { section: NavItem['section']; items: NavItem[] }[] = [];
    for (const item of ANGULAR_NAV_ITEMS) {
      const last = groups[groups.length - 1];
      if (!last || last.section !== item.section) {
        groups.push({ section: item.section, items: [item] });
      } else {
        last.items.push(item);
      }
    }
    return groups;
  });

  /** True if the given nav path matches the current URL segment. */
  isActive(path: string): boolean {
    const e = this.currentUrl();
    const url = e instanceof NavigationEnd ? e.urlAfterRedirects : '';
    return url === path || url.startsWith(path + '/');
  }
}
