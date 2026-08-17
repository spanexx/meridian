/**
 * NotFoundPageComponent — wildcard 404 page.
 *
 * Rendered when the URL matches no registered route (path '**').
 * Sits inside the app shell; offers a way back to the landing.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-17
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="page">
      <div class="card p-10 text-center max-w-md mx-auto mt-16">
        <div class="text-5xl font-light text-soft mb-4">404</div>
        <h1 class="page-title mb-2">Page not found</h1>
        <p class="text-sm text-soft mb-6">
          That route isn't part of Meridian — check the URL, or head back home.
        </p>
        <a [routerLink]="['/']" class="btn btn-primary">Back to the landing</a>
      </div>
    </section>
  `,
  styles: [],
})
export class NotFoundPageComponent {}
