/**
 * UiLogoComponent — the official MERIDIAN mark as flat SVG.
 *
 * Geometry transcribed verbatim from the official logo SVG
 * (user-provided, 2026-08-12):
 *
 *   <circle cx="250" cy="190" r="135" stroke-width="12"/>
 *   <path d="M 221.93 322.05 Q 181.00 180.00 257.07 55.19"/>
 *   <clipPath><circle cx="250" cy="190" r="141"/></clipPath>
 *
 *   - single-stroke circle, perfectly round, centered in its own
 *     square bounding box (282x282)
 *   - one additional stroke: a quadratic-bezier arc, same weight as
 *     the circle, passing through the circle's interior
 *   - the arc bows LEFT (control point 181,180): a narrow crescent
 *     between the arc and the circle's left edge; the larger
 *     region on the right — reads as a globe with one off-center
 *     longitude line, or an abstract "M" tilted
 *   - both ends land exactly on the ring (r=135); the clip at
 *     r=141 trims the round line caps so nothing overshoots
 *   - stroke uses currentColor so theme CSS controls the color —
 *     works on dark and light themes without a second asset
 *
 * Normalized to a 24x24 viewBox (mark bbox 282 -> scale 24/282):
 *   circle cx=12 cy=12 r=11.49, stroke-width=1.02
 *   arc: M 9.61 23.24 Q 6.13 11.15 12.60 0.53
 *   clip: circle cx=12 cy=12 r=12
 *
 * The wordmark ("MERIDIAN", Montserrat 300, 0.55em tracking) is
 * rendered by the consumer alongside this mark (shell.component.ts).
 *
 * @owner   spanexx
 * @reviewed 2026-08-12
 */
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      shape-rendering="geometricPrecision"
      fill="none"
      stroke="currentColor"
      role="img"
      [attr.aria-label]="ariaLabel()"
    >
      <defs>
        <!-- Trims stroke overflow outside the ring radius (official) -->
        <clipPath id="meridian-circle-clip">
          <circle cx="12" cy="12" r="12"></circle>
        </clipPath>
      </defs>
      <!-- Meridian outer ring -->
      <circle
        cx="12"
        cy="12"
        r="11.49"
        stroke-width="1.02"
        stroke-linecap="round"
      ></circle>
      <!-- Internal meridian arc (clipped, official quadratic bezier) -->
      <g clip-path="url(#meridian-circle-clip)">
        <path
          d="M 9.61 23.24 Q 6.13 11.15 12.60 0.53"
          stroke-width="1.02"
          stroke-linecap="round"
          stroke-linejoin="round"
        ></path>
      </g>
    </svg>
  `,
  styles: [
    ':host { display: inline-flex; vertical-align: middle; line-height: 0; color: inherit; }',
  ],
})
export class UiLogoComponent {
  /** Pixel size. Default 28 (sidebar brand-mark slot). */
  readonly size = input<number>(28);
  /** Accessible label. */
  readonly ariaLabel = input<string>('Meridian logo');
}
