/**
 * PlaceholderPageComponent — shared "Coming soon" stub used by routes
 * that don't have a real page yet.
 *
 * The user (2026-08-12): when designing a page that links to other
 * pages, the links must work (lead somewhere) even if the destination
 * is a stub. This component is rendered for every route that doesn't
 * have its own component yet — and is tracked so future packs replace
 * it with the real page.
 *
 * Reads `data` from the route (title / subtitle / iconName / packName)
 * so each placeholder can have its own copy without a per-route class.
 *
 * @owner   spanexx
 * @reviewed 2026-08-12
 */

import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  inject,
} from '@angular/core';
import { ActivatedRoute, Data } from '@angular/router';
import { RouterLink } from '@angular/router';
import { UiIconComponent } from '../../ui/icon/icon.component';

interface PlaceholderData extends Data {
  title?: string;
  subtitle?: string;
  iconName?: string;
  packName?: string;
}

@Component({
  selector: 'app-placeholder-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiIconComponent],
  template: `
    <section class="page">
      <header class="mb-8">
        <h1 class="page-title text-2xl sm:text-3xl">{{ title }}</h1>
        <p class="page-subtitle max-w-2xl mt-2 text-sm leading-relaxed">
          {{ subtitle }}
        </p>
      </header>

      <div class="card p-8 text-center max-w-xl mx-auto" data-testid="placeholder-card">
        <div
          class="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
          style="background: var(--bg-overlay);"
        >
          <ui-icon [name]="iconName" [size]="22" class="text-slate-400"></ui-icon>
        </div>
        <h2 class="text-base font-semibold mb-2">Coming soon</h2>
        <p class="text-sm text-slate-400 leading-relaxed mb-4">
          This page hasn't been built yet — it exists as a stub so
          every link on every page leads somewhere real (no 404s)
          while future packs replace it with the real implementation.
        </p>
        <p class="text-xs text-slate-500 mb-6">
          Pack: <code class="text-slate-300">{{ packName }}</code>
        </p>
        <a class="btn btn-secondary inline-flex items-center gap-2" [routerLink]="['/communities']">
          <ui-icon name="users" class="w-4 h-4"></ui-icon>
          <span>Back to Communities</span>
        </a>
      </div>
    </section>
  `,
})
export class PlaceholderPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  @Input() title = 'Coming soon';
  @Input() subtitle = '';
  @Input() iconName = 'lightbulb';
  @Input() packName = 'unassigned';

  ngOnInit(): void {
    const data = (this.route.snapshot.data ?? {}) as PlaceholderData;
    if (data.title) this.title = data.title;
    if (data.subtitle) this.subtitle = data.subtitle;
    if (data.iconName) this.iconName = data.iconName;
    if (data.packName) this.packName = data.packName;
  }
}
