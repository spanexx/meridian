/**
 * App root — hosts the router outlet and decides whether the shell wraps it.
 *
 * Most routes render inside <ui-shell> (sidebar chrome). Auth pages
 * (/login, /register) are shell-less per their wireframes and get a bare
 * <router-outlet/>. The authRoute signal tracks the active URL via
 * NavigationEnd events so the shell reappears as soon as the user signs in.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-17
 */
import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { ShellComponent } from './shell/shell.component';
import { filter } from 'rxjs/operators';

/**
 * Routes that render WITHOUT the app shell. Auth pages (/login, /register)
 * are shell-less per their wireframe (top bar + centered glass card +
 * footer, no sidebar), so the shell must be omitted for them.
 */
const AUTH_PATHS = ['/login', '/register'];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ShellComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('meridian');
  private readonly router = inject(Router);

  /** True when the active route is a shell-less auth page (/login, /register). */
  protected readonly authRoute = signal(false);

  constructor() {
    // Initialize from the current URL, then keep it fresh on every
    // NavigationEnd (fires on every navigation, including the same route).
    this.authRoute.set(this.isAuthUrl(this.router.url));
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.authRoute.set(this.isAuthUrl(this.router.url)));
  }

  private isAuthUrl(url: string): boolean {
    return AUTH_PATHS.some((path) => url === path || url.startsWith(path + '/'));
  }
}
