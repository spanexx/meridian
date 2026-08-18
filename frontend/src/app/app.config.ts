/**
 * AppConfig — DI providers for the standalone bootstrap.
 *
 * withComponentInputBinding() is the canonical Meridian setup: it lets
 * route params (and query params, and resolved data) auto-bind to a
 * page component's @Input / input() fields by name. The pages
 * community-detail, community-members, member-detail, execution-detail,
 * and opportunity-detail all rely on this binding.
 *
 * Data-layer wiring (Step 5/7 of frontend-data-layer plan): the injected
 * ApiClient is provided here with a concrete transport. In development
 * (environment.useMock) it talks to the in-memory MockGateway seeded via
 * seedGateway(); in production it talks to the real gateway over
 * HttpTransport. Swapping transports MUST NOT change any page — the page
 * only ever sees the typed ApiClient surface.
 *
 * The production HttpTransport now uses Angular's HttpClient with functional
 * interceptors (auth, correlation, error) — the idiomatic Angular 20 pattern.
 * TokenStore holds the session token (in-memory + sessionStorage).
 *
 * @owner   spanexx
 * @reviewed 2026-08-18
 */
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, inject } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { ApiClient } from './core/api/api-client';
import { ApiTransport, API_TRANSPORT } from './core/api/api-transport';
import { HttpTransport } from './core/api/http-transport';
import { MockGateway } from './core/api/mock-gateway';
import { MockTransport } from './core/api/mock-transport';
import { seedGateway } from './core/api/mock-seed';
import { TokenStore } from './core/auth/token-store';
import { authInterceptor } from './core/api/auth.interceptor';
import { correlationInterceptor } from './core/api/correlation.interceptor';
import { errorInterceptor } from './core/api/error.interceptor';
import { HTTP_BASE_URL } from './core/api/http-transport';
import { environment } from '../environments/environment';

/** Build the transport the app runs against for the current environment. */
function buildTransport(): ApiTransport {
  if (environment.useMock) {
    const gateway = new MockGateway();
    seedGateway(gateway);
    return new MockTransport(gateway, environment.latencyMs ?? 0);
  }
  // Production: real gateway via HttpClient-backed HttpTransport.
  // HttpClient is provided by provideHttpClient above; TokenStore is
  // available for the auth interceptor. HttpTransport receives HttpClient
  // (injected) and the base URL (provided via HTTP_BASE_URL token).
  const http = inject(HttpClient);
  return new HttpTransport(http, environment.apiUrl);
}

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
    // HttpClient with functional interceptors (Angular 20 standard):
    // - authInterceptor: attaches Bearer token from TokenStore
    // - correlationInterceptor: attaches X-Request-ID
    // - errorInterceptor: maps HTTP errors to ApiError, clears token on 401
    provideHttpClient(withInterceptors([authInterceptor, correlationInterceptor, errorInterceptor])),
    // TokenStore: session token holder (in-memory + sessionStorage)
    TokenStore,
    // Data-layer wiring: ApiTransport is a type-only interface, so it
    // travels through the API_TRANSPORT InjectionToken. The typed
    // ApiClient injects that token; pages only ever see the ApiClient
    // surface. Transport is chosen by environment (mock vs real gateway).
    { provide: API_TRANSPORT, useFactory: buildTransport },
    { provide: HTTP_BASE_URL, useValue: environment.apiUrl },
    ApiClient,
  ],
};