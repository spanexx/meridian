/**
 * RegisterPageComponent — shell-less /register auth page.
 *
 * Per wireframe/meridian/register/index.html, ported verbatim. Like
 * /login this is a shell-less page (top bar + centered glass card +
 * footer, no app sidebar); the shell-aware router in app.ts omits
 * ui-shell on /register.
 *
 * Behavior pins:
 *   - 'Join the pool' + 'Register to contribute capital, signals, or access.'
 *   - Form fields: Full name, Email, Password, Confirm + terms checkbox
 *   - submit() toasts 'Account created — welcome aboard' then a 900ms
 *     setTimeout navigates to /dashboard
 *   - 'Sign in' cross-links to /login
 *   - Page-level toggleTheme() mirrors ShellComponent.toggleTheme()
 *     (shell.component.ts:194-201).
 *   - In-page ui-toast (signal + @if) mirrors submit-signal's pattern.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-17
 */
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UiToastComponent, type UiToastVariant } from '../../ui/toast/toast.component';
import { UiIconComponent } from '../../ui/icon/icon.component';
import { ApiClient } from '../../core/api/api-client';

interface ToastState {
  readonly title: string;
  readonly message: string;
  readonly variant: UiToastVariant;
}

@Component({
  selector: 'app-register-page',
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
          data-testid="register-logo"
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
          data-testid="register-theme-toggle"
          title="Toggle theme"
          (click)="toggleTheme()"
        >
          <ui-icon name="moon" [size]="16"></ui-icon>
        </button>
      </div>

      <!-- Auth card -->
      <div class="flex-1 flex items-center justify-center px-4 pb-16">
        <div class="glass w-full max-w-md p-6 sm:p-8" data-testid="auth-card">
          <h1 class="text-2xl font-semibold tracking-tight mb-1">Join the pool</h1>
          <p class="text-sm text-slate-500 mb-8">
            Register to contribute capital, signals, or access.
          </p>

          <form (ngSubmit)="submit()" class="space-y-4" data-auth-form>
            <div>
              <label>Full name</label>
              <input
                type="text"
                class="input"
                data-field="fullname"
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label>Email</label>
              <input
                type="email"
                class="input"
                data-field="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label>Password</label>
                <input
                  type="password"
                  class="input"
                  data-field="password"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <label>Confirm</label>
                <input
                  type="password"
                  class="input"
                  data-field="confirm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <div class="flex items-start gap-2">
              <input type="checkbox" id="terms" data-field="terms" required class="mt-0.5" />
              <label for="terms" style="margin-bottom: 0;" class="text-xs text-slate-500">
                I agree to the member agreement — no deposit-based returns, no recruitment rewards,
                integrity first.
              </label>
            </div>
            <button
              type="submit"
              class="btn btn-primary w-full justify-center"
              data-testid="create-account"
            >
              <ui-icon name="user-plus" [size]="16"></ui-icon>Create account
            </button>
          </form>

          <p class="text-xs text-slate-500 mt-8 text-center">
            Already a member?
            <a
              [routerLink]="['/login']"
              class="text-violet-400 hover:text-violet-300 font-medium"
              data-testid="login-link"
              >Sign in</a
            >
          </p>
        </div>
      </div>

      <footer class="text-center pb-6 text-[11px] text-slate-500">
        MERIDIAN · KYC required for payouts · humans decide, AI only recommends
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
export class RegisterPageComponent {
  private readonly router = inject(Router);
  private readonly client = inject(ApiClient);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Current theme key — mirrors ShellComponent's private theme signal. */
  private readonly theme = signal<'dark' | 'light'>(
    (localStorage.getItem('meridian-theme') as 'dark' | 'light') ?? 'dark',
  );

  /** In-page toast state (ui-toast primitive rendered behind @if). */
  readonly toast = signal<ToastState | null>(null);

  /** Toggles the page theme. Auth pages live outside the shell. */
  toggleTheme(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
    document.documentElement.dataset['theme'] = this.theme();
    localStorage.setItem('meridian-theme', this.theme());
  }

  /** Create-account submit — calls the real ApiClient.auth.register(). */
  async submit(): Promise<void> {
    const root = this.host.nativeElement;
    const email = (root.querySelector('input[data-field="email"]') as HTMLInputElement | null)?.value ?? '';
    const password = (root.querySelector('input[data-field="password"]') as HTMLInputElement | null)?.value ?? '';
    const terms = !!(
      root.querySelector('input[data-field="terms"]') as HTMLInputElement | null
    )?.checked;

    try {
      await this.client.register({
        email,
        password,
        password_confirm: password,
        terms_accepted: terms,
      });
      this.showToast('Account created — welcome aboard');
      setTimeout(() => this.router.navigate(['/dashboard']), 900);
    } catch {
      this.showToast('Registration failed — please try again');
    }
  }

  private showToast(message: string): void {
    this.toast.set({ title: '', message, variant: 'success' });
  }
}
