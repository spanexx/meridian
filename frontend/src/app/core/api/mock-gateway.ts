/**
 * MockGateway — in-memory backend for development and tests.
 *
 * Registered routes keyed by "METHOD path"; handlers return raw data
 * (the envelope is built by MockTransport) or throw ApiError with a
 * conventions-documented code. The route list is locked by the spec so
 * an accidental route rename fails CI — the list is the contract for
 * the real gateway swap. See docs/features/frontend-data-layer/.
 *
 * @owner   agent-maintained
 * @reviewed 2026-08-18
 */
import { ApiError } from './api-response';

/** Everything a route handler needs to answer a request. */
export interface GatewayContext {
  method: string;
  /** Path without the query string. */
  path: string;
  /** Parsed query parameters (string values). */
  query: Record<string, string>;
  /** Parsed JSON body, when the request carried one. */
  body: unknown;
}

/** A route handler: returns raw data or throws ApiError. */
export type GatewayHandler = (ctx: GatewayContext) => unknown | Promise<unknown>;

export class MockGateway {
  private readonly routes = new Map<string, GatewayHandler>();

  /** Register a handler for "METHOD /path". */
  register(method: string, path: string, handler: GatewayHandler): void {
    this.routes.set(`${method} ${path}`, handler);
  }

  /** The locked route list ("GET /items") — asserted by the spec. */
  get routesList(): string[] {
    return [...this.routes.keys()];
  }

  /**
   * Dispatch a request. `pathWithQuery` may carry "?a=1&b=2"; unknown
   * routes throw ApiError NOT_FOUND (conventions §Resource Errors).
   */
  async handle(method: string, pathWithQuery: string, body?: unknown): Promise<unknown> {
    const [path, queryString] = pathWithQuery.split('?');
    const key = `${method} ${path}`;
    const handler = this.routes.get(key);
    if (!handler) {
      throw new ApiError('NOT_FOUND', `No mock route for ${key}`);
    }
    const query: Record<string, string> = {};
    if (queryString) {
      const pair = (p: string): void => {
        const eq = p.indexOf('=');
        if (eq === -1) return;
        query[decodeURIComponent(p.slice(0, eq))] = decodeURIComponent(p.slice(eq + 1));
      };
      queryString.split('&').forEach(pair);
    }
    return handler({ method, path, query, body });
  }
}