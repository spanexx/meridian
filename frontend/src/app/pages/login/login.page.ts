/**
 * LoginPageComponent — shell-less /login auth page.
 *
 * Per wireframe/meridian/login/index.html, ported verbatim. This is one
 * of the FIRST shell-less pages: the wireframe renders /login standalone
 * (top bar + centered glass card + footer) with NO app sidebar. The
 * router is shell-aware (see app.ts authRoute) so ui-shell is omitted on
 * /login and /register.
 *
 * Behavior pins:
 *   - Shell-less layout; top bar logo links to /dashboard; the page has
 *     its OWN theme toggle mirroring ShellComponent.toggleTheme()
 *     (shell.component.ts:194-201) because auth pages live outside the shell.
 *   - 'Welcome back' + 'Sign in to your MERIDIAN account.'
 *   - Form prefills the demo credentials (alex@meridian.com /
 *     demo-password) + 'Demo: any credentials work.'
 *   - forgot() toasts 'Reset link sent to alex@meridian.com'
 *   - submit() toasts 'Signed in — welcome back' then a 900ms setTimeout
 *     navigates to /dashboard
 *   - passkey() / twoFA() toast 'Passkey requested' / '2FA code sent by email'
 *   - 'Create an account' cross-links to /register
 *   - In-page ui-toast (signal + @if) mirrors submit-signal's pattern.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-17
 */
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UiToastComponent, type UiToastVariant } from '../../ui/toast/toast.component';

interface ToastState {
  readonly title: string;
  readonly message: string;
  readonly variant: UiToastVariant;
}

@Component({
  selector: 'app-login-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, UiToastComponent],
  template: `
    <div class="min-h-screen flex flex-col">
      <!-- Top bar -->
      <div class="flex items-center justify-between px-6 py-4">
        <a
          [routerLink]="['/dashboard']"
          class="flex items-center gap-2.5"
          data-testid="login-logo"
          title="Go to dashboard"
        >
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center"
            style="background: var(--gradient-violet);"
          >
            <i data-lucide="diamond" class="w-4 h-4 text-white"></i>
          </div>
          <div>
            <div class="text-sm font-semibold tracking-tight">MERIDIAN</div>
            <div class="text-[10px] uppercase tracking-widest text-slate-500">
              Collective Arbitrage
            </div>
          </div>
        </a>
        <button
          type="button"
          class="icon-btn"
          data-theme-toggle
          data-testid="login-theme-toggle"
          title="Toggle theme"
          (click)="toggleTheme()"
        >
          <i data-lucide="moon" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- Auth card -->
      <div class="flex-1 flex items-center justify-center px-4 pb-16">
        <div class="glass w-full max-w-md p-6 sm:p-8" data-testid="auth-card">
          <h1 class="text-2xl font-semibold tracking-tight mb-1">Welcome back</h1>
          <p class="text-sm text-slate-500 mb-8">Sign in to your MERIDIAN account.</p>

          <form (ngSubmit)="submit()" class="space-y-4" data-auth-form>
            <div>
              <label>Email</label>
              <input
                type="email"
                class="input"
                data-field="email"
                value="alex@meridian.com"
                required
              />
            </div>
            <div>
              <div class="flex items-center justify-between mb-1">
                <label style="margin-bottom: 0;">Password</label>
                <button
                  type="button"
                  class="text-xs text-violet-400 hover:text-violet-300"
                  data-testid="forgot"
                  (click)="forgot()"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                class="input"
                data-field="password"
                value="demo-password"
                required
              />
              <p class="text-[11px] text-slate-500 mt-1.5">Demo: any credentials work.</p>
            </div>
            <div class="flex items-center gap-2">
              <input type="checkbox" id="remember" checked />
              <label for="remember" style="margin-bottom: 0;" class="text-xs">Remember me</label>
            </div>
            <button
              type="submit"
              class="btn btn-primary w-full justify-center"
              data-testid="sign-in"
            >
              <i data-lucide="log-in" class="w-4 h-4"></i>Sign in
            </button>
          </form>

          <div
            class="my-6 flex items-center gap-3 text-[11px] text-slate-500 uppercase tracking-wider"
          >
            <div class="flex-1 h-px" style="background: var(--border-subtle);"></div>
            or
            <div class="flex-1 h-px" style="background: var(--border-subtle);"></div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              class="btn btn-secondary justify-center"
              data-testid="passkey"
              (click)="passkey()"
            >
              <i data-lucide="fingerprint" class="w-4 h-4"></i>Passkey
            </button>
            <button
              type="button"
              class="btn btn-secondary justify-center"
              data-testid="twofa"
              (click)="twoFA()"
            >
              <i data-lucide="shield-check" class="w-4 h-4"></i>2FA code
            </button>
          </div>

          <p class="text-xs text-slate-500 mt-8 text-center">
            New to MERIDIAN?
            <a
              [routerLink]="['/register']"
              class="text-violet-400 hover:text-violet-300 font-medium"
              data-testid="register-link"
              >Create an account</a
            >
          </p>
        </div>
      </div>

      <footer class="text-center pb-6 text-[11px] text-slate-500">
        MERIDIAN · member-owned · every execution reconstructable from the event stream
      </footer>
    </div>

    @if (toast(); as t) {
      <ui-toast
        [title]="t.title"
        [message]="t.message"
        [variant]="t.variant"
        (dismiss)="toast.set(null)"
      />
    }
  `,
})
export class LoginPageComponent {
  private readonly router = inject(Router);

  /** Current theme key — mirrors ShellComponent's private theme signal. */
  private readonly theme = signal<'dark' | 'light'>('dark');

  /** In-page toast state (ui-toast primitive rendered behind @if). */
  readonly toast = signal<ToastState | null>(null);

  /** Toggles the page theme. Auth pages live outside the shell. */
  toggleTheme(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
    document.documentElement.dataset['theme'] = this.theme();
  }

  /** 'Forgot password?' — demos the email reset link. */
  forgot(): void {
    this.showToast('Reset link sent to alex@meridian.com');
  }

  /** Sign-in submit — success toast, then 900ms → /dashboard. */
  submit(): void {
    this.showToast('Signed in — welcome back');
    setTimeout(() => this.router.navigate(['/dashboard']), 900);
  }

  /** Secondary 'Passkey' action. */
  passkey(): void {
    this.showToast('Passkey requested');
  }

  /** Secondary '2FA code' action. */
  twoFA(): void {
    this.showToast('2FA code sent by email');
  }

  private showToast(message: string): void {
    this.toast.set({ title: '', message, variant: 'success' });
  }
}
