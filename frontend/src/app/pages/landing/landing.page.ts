/**
 * LandingPageComponent — shell-less marketing page (root route).
 *
 * Per wireframe/meridian/landing/index.html. Ported verbatim: hero
 * (mesh/grid-floor backdrop, brand nav with theme toggle, terminal
 * live-feed card, stat strip), three-way contribution pillars with the
 * 60/25/15 split, live ticker, by-the-numbers cards (sparklines, win-rate
 * and members bars), process flow nodes, five principles, testimonials,
 * CTA and footer. Root route renders WITHOUT the ui-shell (extended
 * shell-less paths in app.ts).
 *
 * Deliberate deviations: entrance animations (IntersectionObserver reveal,
 * big-num count-up, scroll-progress bar, sticky-head stuck state) are NOT
 * ported — content is statically visible, same end state; theme toggle is
 * ported page-level (shell/auth precedent).
 *
 * BRIDGE 2026-08-21 (backend-readiness Job F): the large inline styles
 * array moved to src/app/pages/landing/landing.styles.scss (imported as a
 * global stylesheet in angular.json) to clear the anyComponentStyle budget
 * warning. See the stylesheet header for the rationale. The template stays
 * split into landing.template.html; no visual or DOM change.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-21
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiIconComponent } from '../../ui/icon/icon.component';
import { UiLogoComponent } from '../../ui/logo/ui-logo.component';
import { ThemeService } from '../../core/state/theme.service';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiIconComponent, UiLogoComponent],
  templateUrl: './landing.template.html',
})
export class LandingPageComponent {
  // Pack B: theme owned by ThemeService (single owner, persisted) —
  // the landing page keeps its own toggle button, delegating to it.
  private readonly themeService = inject(ThemeService);

  toggleTheme(): void {
    this.themeService.toggle();
  }
}