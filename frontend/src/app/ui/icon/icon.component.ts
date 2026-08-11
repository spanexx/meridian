/**
 * UiIconComponent — inline-SVG icon component replacing lucide-angular
 * (which was removed mid-session, 2026-08-11, per MEMORY).
 *
 * The dashboard wireframe uses 13 lucide icons. This component maps
 * each to an inline SVG so we get the visual fidelity of the
 * wireframe without pulling in the lucide-angular package. Adding
 * the package would add ~150kB to the bundle for 13 icons.
 *
 * Usage:
 *   <ui-icon name="plus" />
 *   <ui-icon name="zap" size="14" />
 *   <ui-icon name="plus" [ariaLabel]="'Submit'" />
 *
 * The path strings come from a static lookup table (ICON_PATHS) so
 * the only thing the DomSanitizer sees is well-formed SVG markup.
 * We use bypassSecurityTrustHtml because Angular's default HTML
 * sanitizer strips event handlers AND removes non-HTML elements it
 * does not recognize (line/polyline/polygon fall in the latter).
 * The icon data is static code (not user input), so trust is safe.
 *
 * When the icon name is unknown the component renders an empty SVG
 * with a debug data-attribute so dashboards never silently lose
 * their icons.
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
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';

/**
 * SVG path data for each supported icon. Sourced from lucide v0.x
 * the same icons bundled with the wireframe (meridian/meridian/kit/).
 * 21 names now cover every icon currently referenced in any
 * meridian wireframe page.
 */
const ICON_PATHS: Readonly<Record<string, string>> = Object.freeze({
  'arrow-right':  '<line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline>',
  'banknote':     '<rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path>',
  'bell':         '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>',
  'circle-dollar-sign': '<circle cx="12" cy="12" r="10"></circle><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 18V6"></path>',
  'clock':        '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
  'cpu':          '<rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="2" x2="9" y2="4"></line><line x1="15" y1="2" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="22"></line><line x1="15" y1="20" x2="15" y2="22"></line><line x1="20" y1="9" x2="22" y2="9"></line><line x1="20" y1="14" x2="22" y2="14"></line><line x1="2" y1="9" x2="4" y2="9"></line><line x1="2" y1="14" x2="4" y2="14"></line>',
  'diamond':      '<path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l8.6 8.6a2.41 2.41 0 0 0 3.41 0l8.6-8.6a2.41 2.41 0 0 0 0-3.41l-8.6-8.6a2.41 2.41 0 0 0-3.41 0z"></path>',
  'filter':       '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>',
  'layout-dashboard': '<rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect>',
  'lightbulb':    '<path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"></path>',
  'log-out':      '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>',
  'menu':         '<line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>',
  'moon':         '<path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 0 0 21 12.79z"></path>',
  'package':      '<line x1="16.5" y1="9.4" x2="21.5" y2="15"></line><line x1="19" y1="5" x2="9" y2="15"></line><line x1="9" y1="9" x2="9" y2="19" stroke-linejoin="round"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>',
  'plus':         '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>',
  'plus-circle':  '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line>',
  'settings':     '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>',
  'share-2':      '<circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>',
  'trending-up':  '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline>',
  'user':         '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
  'users':        '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
  'vote':         '<path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>',
  'watch':        '<circle cx="12" cy="12" r="6"></circle><polyline points="12 10 12 12 13 13"></polyline><polyline points="16.13 2.5 16.13 5.5 19.13 5.5"></polyline><polyline points="7.87 2.5 7.87 5.5 4.87 5.5"></polyline>',
  'zap':          '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>',
});

@Component({
  selector: 'ui-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.aria-hidden]="ariaLabel() ? null : 'true'"
      [attr.aria-label]="ariaLabel() || null"
      [attr.role]="ariaLabel() ? 'img' : null"
      [attr.data-icon]="name()"
      [innerHTML]="safePath()"
    ></svg>
  `,
  styles: [
    ':host { display: inline-flex; vertical-align: middle; line-height: 0; }',
    ':host svg { display: block; }',
  ],
})
export class UiIconComponent {
  private readonly sanitizer = inject(DomSanitizer);

  /** Icon name. Unknown names render an empty svg with a debug attribute. */
  readonly name = input.required<string>();
  /** Pixel size; default 18 matches the wireframe's `w-4.5 h-4.5` visual weight. */
  readonly size = input<number>(18);
  /** If set, the svg is exposed to assistive tech via aria-label + role=img. */
  readonly ariaLabel = input<string | null>(null);

  /**
   * Resolves to the icon's SVG inner content, sanitized via Angular's
   * DomSanitizer bypass. The data is static (not user input), so the
   * trust is safe and necessary — Angular's default sanitizer strips
   * SVG primitives like <line> that aren't pure-HTML.
   */
  readonly safePath = computed<SafeHtml>(() => {
    const raw = ICON_PATHS[this.name()] ?? '';
    if (!raw && typeof console !== 'undefined') {
      console.warn(`UiIconComponent: unknown icon name "${this.name()}"`);
    }
    return this.sanitizer.bypassSecurityTrustHtml(raw);
  });
}
