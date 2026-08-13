/**
 * AppConfig — DI providers for the standalone bootstrap.
 *
 * withComponentInputBinding() is the canonical Meridian setup: it lets
 * route params (and query params, and resolved data) auto-bind to a
 * page component's @Input / input() fields by name. The pages
 * community-detail, community-members, member-detail, execution-detail,
 * and opportunity-detail all rely on this binding.
 *
 * @owner   spanexx
 * @reviewed 2026-08-13
 */
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    // withComponentInputBinding() makes route params (and query params,
    // and resolved data) auto-bind to component @Input / input() fields
    // with matching names. Without it, a page bound to /community/:id
    // /members/:memberId has to subscribe to ActivatedRoute.params itself
    // to read the id. This is the canonical Meridian setup — see
    // community-detail.page.ts, community-members.page.ts etc. for the
    // @Input pattern that depends on this binding.
    provideRouter(routes, withComponentInputBinding()),
  ]
};
