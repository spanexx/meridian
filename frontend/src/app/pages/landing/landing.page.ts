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
 * @owner   agent-maintained
 * @reviewed 2026-08-17
 */
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiIconComponent } from '../../ui/icon/icon.component';
import { UiLogoComponent } from '../../ui/logo/ui-logo.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiIconComponent, UiLogoComponent],
  templateUrl: './landing.template.html',
  styles: [
    `
      /* Theme-aware semantic text colors (landing-only helpers). */
      .text-1 {
        color: var(--text-1);
      }
      .text-2 {
        color: var(--text-2);
      }
      .text-3 {
        color: var(--text-3);
      }
      .text-muted {
        color: var(--text-3);
      }
      .text-soft {
        color: var(--text-2);
      }
      .hover-text-1:hover {
        color: var(--text-1);
      }

      /* Alt-band backgrounds that work in both themes. */
      .section-soft {
        background: color-mix(in srgb, var(--bg-overlay) 70%, var(--bg-base) 30%);
      }
      .section-glass {
        background: color-mix(in srgb, var(--bg-elevated) 75%, transparent);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }

      /* Grid floor under the hero mesh. */
      .grid-floor {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 60%;
        z-index: 0;
        pointer-events: none;
        background-image:
          linear-gradient(
            to right,
            color-mix(in srgb, var(--text-1) 6%, transparent) 1px,
            transparent 1px
          ),
          linear-gradient(
            to bottom,
            color-mix(in srgb, var(--text-1) 6%, transparent) 1px,
            transparent 1px
          );
        background-size: 56px 56px;
        mask-image: radial-gradient(ellipse 70% 70% at 50% 100%, black 30%, transparent 80%);
        -webkit-mask-image: radial-gradient(
          ellipse 70% 70% at 50% 100%,
          black 30%,
          transparent 80%
        );
        transform: perspective(900px) rotateX(60deg);
        transform-origin: bottom center;
      }

      /* Animated mesh gradient backdrop (hero). */
      .mesh {
        position: absolute;
        inset: -10%;
        z-index: 0;
        pointer-events: none;
        background:
          radial-gradient(
            45% 40% at 18% 22%,
            color-mix(in srgb, var(--v-400) 18%, transparent),
            transparent 60%
          ),
          radial-gradient(
            40% 35% at 82% 18%,
            color-mix(in srgb, var(--p-400) 14%, transparent),
            transparent 60%
          ),
          radial-gradient(
            55% 45% at 50% 92%,
            color-mix(in srgb, var(--r-400) 8%, transparent),
            transparent 60%
          );
        filter: blur(40px) saturate(1.1);
        animation: meshDrift 22s ease-in-out infinite alternate;
      }
      @keyframes meshDrift {
        0% {
          transform: translate3d(-2%, -1%, 0) scale(1);
        }
        50% {
          transform: translate3d(2%, 1%, 0) scale(1.04);
        }
        100% {
          transform: translate3d(-1%, 2%, 0) scale(1.02);
        }
      }

      /* Logo wordmark. */
      .logo-mark {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: var(--gradient-violet);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        box-shadow:
          0 8px 24px rgba(168, 106, 45, 0.35),
          inset 0 1px 0 rgba(255, 255, 255, 0.18);
      }
      .logo-mark::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
          135deg,
          transparent 0%,
          rgba(255, 255, 255, 0.18) 50%,
          transparent 100%
        );
        animation: logoSheen 6s ease-in-out infinite;
      }
      @keyframes logoSheen {
        0%,
        100% {
          transform: translateX(-100%);
        }
        50% {
          transform: translateX(100%);
        }
      }

      /* Section eyebrow. */
      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--v-400);
      }
      .eyebrow::before {
        content: '';
        display: inline-block;
        width: 24px;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--v-400));
      }

      /* Glow border for elevated cards. */
      .ring-glow {
        position: relative;
      }
      .ring-glow::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        padding: 1px;
        background: linear-gradient(
          135deg,
          rgba(201, 138, 66, 0.55),
          rgba(20, 184, 166, 0.25) 50%,
          transparent 80%
        );
        -webkit-mask:
          linear-gradient(#000 0 0) content-box,
          linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
        opacity: 0.7;
      }

      /* Hero CTA pulse halo. */
      .pulse-halo {
        position: relative;
      }
      .pulse-halo::before {
        content: '';
        position: absolute;
        inset: -4px;
        border-radius: inherit;
        box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.45);
        animation: halo 2.4s ease-out infinite;
        pointer-events: none;
      }
      @keyframes halo {
        0% {
          box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.45);
        }
        100% {
          box-shadow: 0 0 0 14px rgba(20, 184, 166, 0);
        }
      }

      /* KPI big numbers (static — count-up animation not ported). */
      .big-num {
        font-size: clamp(2.5rem, 5vw, 3.5rem);
        font-weight: 300;
        letter-spacing: -0.04em;
        line-height: 1;
        font-variant-numeric: tabular-nums;
      }

      /* Sparkline. */
      .spark {
        width: 100%;
        height: 48px;
        display: block;
      }

      /* Contribution pillar hover. */
      .pillar {
        transition:
          transform 280ms cubic-bezier(0.16, 1, 0.3, 1),
          border-color 280ms ease,
          background 280ms ease;
      }
      .pillar:hover {
        transform: translateY(-4px);
      }

      /* Live ticker. */
      .ticker {
        overflow: hidden;
        mask-image: linear-gradient(90deg, transparent, black 6%, black 94%, transparent);
        -webkit-mask-image: linear-gradient(90deg, transparent, black 6%, black 94%, transparent);
      }
      .ticker-track {
        display: inline-flex;
        gap: 1rem;
        animation: ticker 60s linear infinite;
        will-change: transform;
      }
      @keyframes ticker {
        from {
          transform: translateX(0);
        }
        to {
          transform: translateX(-50%);
        }
      }

      /* Process flow: ring pulse on each node, staggered. */
      .flow-node {
        position: relative;
      }
      .flow-node::after {
        content: '';
        position: absolute;
        left: 50%;
        top: 27px;
        width: 56px;
        height: 56px;
        margin-left: -28px;
        margin-top: -28px;
        border-radius: 9999px;
        border: 1.5px solid var(--v-400);
        opacity: 0;
        pointer-events: none;
        animation: nodeRing 5s ease-out infinite;
      }
      @keyframes nodeRing {
        0%,
        60% {
          transform: scale(0.85);
          opacity: 0;
        }
        64% {
          opacity: 0.7;
        }
        80% {
          transform: scale(1.5);
          opacity: 0;
        }
        100% {
          transform: scale(1.5);
          opacity: 0;
        }
      }
      .flow-node.n1::after {
        animation-delay: 0s;
      }
      .flow-node.n2::after {
        animation-delay: 0.8s;
      }
      .flow-node.n3::after {
        animation-delay: 1.6s;
      }
      .flow-node.n4::after {
        animation-delay: 2.4s;
      }
      .flow-node.n5::after {
        animation-delay: 3.2s;
      }

      /* Static dashed connector between flow nodes. */
      .connector {
        flex: 1;
        height: 1px;
        margin-top: 27px;
        background: repeating-linear-gradient(
          90deg,
          var(--border-default) 0 6px,
          transparent 6px 10px
        );
      }

      /* Terminal card. */
      .term {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 0.78rem;
        line-height: 1.65;
      }
      .term .ok {
        color: var(--e-400);
      }
      .term .dim {
        color: var(--text-3);
      }
      .term .acc {
        color: var(--v-400);
      }
      .term .pnk {
        color: var(--p-400);
      }

      /* Caret blink. */
      .caret {
        display: inline-block;
        width: 7px;
        height: 14px;
        background: var(--v-400);
        margin-left: 2px;
        vertical-align: text-bottom;
        animation: blink 1s steps(2) infinite;
      }
      @keyframes blink {
        50% {
          opacity: 0;
        }
      }

      /* Testimonial card hover. */
      .quote-card {
        transition:
          transform 250ms ease,
          border-color 250ms ease;
      }
      .quote-card:hover {
        transform: translateY(-3px);
        border-color: var(--border-default);
      }

      /* Stat bar. */
      .stat-bar {
        height: 6px;
        border-radius: 9999px;
        background: var(--bg-overlay);
        overflow: hidden;
        position: relative;
      }
      .stat-bar > span {
        display: block;
        height: 100%;
        border-radius: 9999px;
      }
      .stat-bar > span::after {
        content: '';
        position: absolute;
        inset: 0;
        width: var(--w, 100%);
        border-radius: 9999px;
        background: var(--gradient-emerald);
        animation: fillBar 1.4s cubic-bezier(0.16, 1, 0.3, 1) both;
      }
      @keyframes fillBar {
        from {
          width: 0%;
        }
      }

      /* Footer column heading. */
      .foot-h {
        font-size: 0.68rem;
        font-weight: 600;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--text-3);
        margin-bottom: 0.75rem;
      }

      /* Sticky section headers (lg+ only). */
      .sticky-head {
        padding-bottom: 1rem;
        position: -webkit-sticky;
        position: sticky;
        top: 6rem;
        z-index: 5;
        align-self: start;
      }
      @media (max-width: 1023.98px) {
        .sticky-head {
          position: static;
        }
      }

      /* Reduced motion. */
      @media (prefers-reduced-motion: reduce) {
        .mesh,
        .ticker-track,
        .flow-node::after,
        .pulse-halo::before,
        .logo-mark::after,
        .stat-bar > span::after {
          animation: none !important;
          transition: none !important;
        }
      }
    `,
  ],
})
export class LandingPageComponent {
  /** Current theme key (page-level toggle; mirrors shell + auth pages). */
  private readonly theme = signal<'dark' | 'light'>(
    (localStorage.getItem('meridian-theme') as 'dark' | 'light') ?? 'dark',
  );

  toggleTheme(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
    document.documentElement.dataset['theme'] = this.theme();
    localStorage.setItem('meridian-theme', this.theme());
  }
}
