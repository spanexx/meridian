/**
 * App root — hosts the router outlet and decides whether the shell wraps it.
 *
 * Most routes render inside <ui-shell> (sidebar chrome). Shell-less pages
 * (landing root, /login, /register) have their own chrome per their
 * wireframes and get a bare <router-outlet/>. The shellLess signal tracks
 * the active URL via NavigationEnd events so the shell reappears as soon
 * as the user signs in or navigates into the app.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-17
 */
import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { ShellComponent } from './shell/shell.component';
import { filter } from 'rxjs/operators';

/**
 * Routes that render WITHOUT the app shell. Landing (root), login and
 * register are shell-less per their wireframes (own top bar/chrome, no
 * sidebar), so the shell must be omitted for them.
 */
const SHELL_LESS_PATHS = ['/', '/login', '/register'];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ShellComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('meridian');
  private readonly router = inject(Router);

  /** True when the active route is a shell-less page (landing, /login, /register). */
  protected readonly shellLess = signal(false);

  constructor() {
    // Apply the persisted theme before first paint (mirrors the wireframe
    // boot script; the shell/landing toggles write it on every change).
    const stored = localStorage.getItem('meridian-theme');
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.dataset['theme'] = stored;
    }
    // Initialize from the current URL, then keep it fresh on every
    // NavigationEnd (fires on every navigation, including the same route).
    this.shellLess.set(this.isShellLessUrl(this.router.url));
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.shellLess.set(this.isShellLessUrl(this.router.url)));
  }

  private isShellLessUrl(url: string): boolean {
    // Strip fragment (hash) since router.url may include it during navigation
    const urlWithoutHash = url.split('#')[0];
    return SHELL_LESS_PATHS.some(
      (path) => urlWithoutHash === path || (path !== '/' && urlWithoutHash.startsWith(path + '/')),
    );
  }
}
