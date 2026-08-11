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
  input,
} from '@angular/core';

/**
 * SVG path data for each supported icon. Sourced from lucide v0.x
 * the same icons bundled with the wireframe (meridian/meridian/kit/).
 * 13 names cover every icon currently referenced in any meridian
 * wireframe page.
 */
const ICON_PATHS: Readonly<Record<string, string>> = Object.freeze({
  'arrow-right':  '<line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline>',
  'banknote':     '<rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path>',
  'clock':        '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
  'cpu':          '<rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="2" x2="9" y2="4"></line><line x1="15" y1="2" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="22"></line><line x1="15" y1="20" x2="15" y2="22"></line><line x1="20" y1="9" x2="22" y2="9"></line><line x1="20" y1="14" x2="22" y2="14"></line><line x1="2" y1="9" x2="4" y2="9"></line><line x1="2" y1="14" x2="4" y2="14"></line>',
  'filter':       '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>',
  'lightbulb':    '<path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"></path>',
  'package':      '<line x1="16.5" y1="9.4" x2="21.5" y2="15"></line><line x1="19" y1="5" x2="9" y2="15"></line><line x1="9" y1="9" x2="9" y2="19" stroke-linejoin="round"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>',
  'plus':         '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>',
  'share-2':      '<circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>',
  'trending-up':  '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline>',
  'users':        '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
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
      [innerHTML]="paths()"
    ></svg>
  `,
  styles: [
    ':host { display: inline-flex; vertical-align: middle; line-height: 0; }',
    ':host svg { display: block; }',
  ],
})
export class UiIconComponent {
  /** Icon name. Unknown names render an empty svg with a debug attribute. */
  readonly name = input.required<string>();
  /** Pixel size; default 16 matches lucide's `w-4 h-4` Tailwind size. */
  readonly size = input<number>(16);
  /** If set, the svg is exposed to assistive tech via aria-label + role=img. */
  readonly ariaLabel = input<string | null>(null);

  /** Resolves to the icon's SVG inner content, or empty string when unknown. */
  readonly paths = computed(() => {
    const raw = ICON_PATHS[this.name()] ?? '';
    if (!raw && typeof console !== 'undefined') {
      console.warn(`UiIconComponent: unknown icon name "${this.name()}"`);
    }
    return raw;
  });
}
