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
 *     navigates to /dashboard; a 2FA challenge flips the page to a
 *     6-digit code step (Pack C) and the user enters the code there.
 *   - passkey() / twoFA() toast 'Passkey requested' / '2FA code sent by email'
 *   - 'Create an account' cross-links to /register
 *   - In-page ui-toast (signal + @if) mirrors submit-signal's pattern.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-19
 */
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UiToastComponent, type UiToastVariant } from '../../ui/toast/toast.component';
import { UiIconComponent } from '../../ui/icon/icon.component';
import { ThemeService } from '../../core/state/theme.service';
import { AuthStore } from '../../core/state/auth.store';
import type { TwoFactorChallenge } from '../../core/models';

interface ToastState {
  readonly title: string;
  readonly message: string;
  readonly variant: UiToastVariant;
}

@Component({
  selector: 'app-login-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, UiToastComponent, UiIconComponent],
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
            <ui-icon name="diamond" [size]="16" class="text-white"></ui-icon>
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
          <ui-icon name="moon" [size]="16"></ui-icon>
        </button>
      </div>

      <!-- Auth card -->
      <div class="flex-1 flex items-center justify-center px-4 pb-16">
        <div class="glass w-full max-w-md p-6 sm:p-8" data-testid="auth-card">
          @if (step() === 'creds') {
            <h1 class="text-2xl font-semibold tracking-tight mb-1">Welcome back</h1>
            <p class="text-sm text-slate-500 mb-8">Sign in to your MERIDIAN account.</p>

            <form (ngSubmit)="submit()" class="space-y-4" data-auth-form>
              <div>
                <label for="login-email">Email</label>
                <input
                  type="email"
                  class="input"
                  data-field="email"
                  value="alex@meridian.com"
                  id="login-email"
                  required
                />
              </div>
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label for="login-password" style="margin-bottom: 0;">Password</label>
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
                  id="login-password"
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
                <ui-icon name="log-in" [size]="16"></ui-icon>Sign in
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
                <ui-icon name="fingerprint" [size]="16"></ui-icon>Passkey
              </button>
              <button
                type="button"
                class="btn btn-secondary justify-center"
                data-testid="twofa"
                (click)="twoFA()"
              >
                <ui-icon name="shield-check" [size]="16"></ui-icon>2FA code
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
          } @else {
            <h1 class="text-2xl font-semibold tracking-tight mb-1">Two-factor verification</h1>
            <p class="text-sm text-slate-500 mb-8">
              {{ pending2fa()?.message ?? 'Enter the 6-digit code from your authenticator app.' }}
            </p>

            <form (ngSubmit)="submitCode(code())" class="space-y-4" data-2fa-form>
              <div>
                <label for="login-2fa">6-digit code</label>
                <input
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]{6}"
                  maxlength="6"
                  class="input tracking-[0.5em] text-center text-lg"
                  data-field="code"
                  id="login-2fa"
                  autocomplete="one-time-code"
                  [value]="code()"
                  (input)="onCodeInput($event)"
                  required
                />
              </div>
              <button
                type="submit"
                class="btn btn-primary w-full justify-center"
                data-testid="verify-2fa"
              >
                <ui-icon name="shield-check" [size]="16"></ui-icon>Verify
              </button>
            </form>

            <button
              type="button"
              class="block mx-auto mt-6 text-xs text-slate-500 hover:text-slate-300"
              data-testid="back-to-creds"
              (click)="backToCreds()"
            >
              ← Use a different account
            </button>
          }
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
  // Pack C (2026-08-19): the auth field is `protected` (not `private`)
  // so spec files can swap in a spy after construction when the 2FA
  // branch is hard to reach. Production code never reassigns it; the
  // runtime field is a normal AuthStore from DI.
  protected readonly auth = inject(AuthStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  // Pack B: theme owned by ThemeService (single owner, persisted) —
  // auth pages live outside the shell so they call it directly.
  private readonly themeService = inject(ThemeService);

  /** In-page toast state (ui-toast primitive rendered behind @if). */
  readonly toast = signal<ToastState | null>(null);

  /** Pack C: 2FA challenge step. 'creds' = the wireframe creds form, 'code' = the 6-digit input. */
  readonly step = signal<'creds' | 'code'>('creds');

  /** Pack C: the 2FA challenge payload held while the user is on the code step. */
  readonly pending2fa = signal<TwoFactorChallenge | null>(null);

  /** Pack C: the 6-digit code entered in the challenge input. */
  readonly code = signal<string>('');

  /** Toggles the page theme. Auth pages live outside the shell. */
  toggleTheme(): void {
    this.themeService.toggle();
  }

  /** 'Forgot password?' — demos the email reset link. */
  forgot(): void {
    this.showToast('Reset link sent to alex@meridian.com');
  }

  /** Sign-in submit — via AuthStore (persists the token internally). */
  async submit(): Promise<void> {
    const root = this.host.nativeElement;
    const email = (root.querySelector('input[data-field="email"]') as HTMLInputElement | null)?.value ?? '';
    const password = (root.querySelector('input[data-field="password"]') as HTMLInputElement | null)?.value ?? '';

    try {
      const res = await this.auth.login(email, password);
      // Pack B: AuthStore persists the access token to TokenStore on a
      // successful login (Bearer flows to the real gateway afterwards).
      // Pack C: a 2FA challenge carries no token; flip the page to a
      // 6-digit code step instead of navigating to /dashboard.
      if ('access_token' in res) {
        this.showToast('Signed in — welcome back');
        setTimeout(() => this.router.navigate(['/dashboard']), 900);
      } else {
        this.pending2fa.set(res);
        this.code.set('');
        this.step.set('code');
      }
    } catch {
      this.showToast('Sign-in failed — please try again');
    }
  }

  /** Pack C: 2FA code submit — completes the challenge via AuthStore.login2fa. */
  async submitCode(code: string): Promise<void> {
    const pending = this.pending2fa();
    if (!pending) {
      this.step.set('creds');
      return;
    }
    try {
      await this.auth.login2fa(pending.temp_token, code);
      this.showToast('Verified — welcome back');
      setTimeout(() => this.router.navigate(['/dashboard']), 900);
    } catch {
      this.showToast('Code incorrect — please try again');
    }
  }

  /** Pack C: 2FA → creds back link — clears the pending challenge. */
  backToCreds(): void {
    this.pending2fa.set(null);
    this.code.set('');
    this.step.set('creds');
  }

  /** Pack C: capture the 6-digit code input as it changes. */
  onCodeInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.code.set((target?.value ?? '').replace(/\D/g, '').slice(0, 6));
  }

  /** Secondary 'Passkey' action. */
  passkey(): void {
    this.showToast('Passkey requested');
  }

  /** Secondary '2FA code' action. */
  twoFA(): void {
    this.showToast('2FA code sent by email');
  }

  private showToast(message: string, variant: UiToastVariant = 'success'): void {
    this.toast.set({ title: '', message, variant });
  }
}
