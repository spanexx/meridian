/**
 * MockGateway — in-memory backend for development and tests.
 *
 * Registered routes keyed by "METHOD path"; handlers return raw data
 * (the envelope is built by MockTransport) or throw ApiError with a
 * conventions-documented code. The route list is locked by the spec so
 * an accidental route rename fails CI — the list is the contract for
 * the real gateway swap. See docs/features/frontend-data-layer/.
 *
 * Pattern routes (registerPattern) match ':name' path segments and
 * expose the captured values as ctx.params. Exact routes always win
 * over patterns — the seed registers e.g. GET /opportunities/mine
 * exactly and GET /opportunities/:id as a pattern.
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
  /** Captured ':name' path params (pattern routes; empty for exact routes). */
  params?: Record<string, string>;
}

/** A route handler: returns raw data or throws ApiError. */
export type GatewayHandler = (ctx: GatewayContext) => unknown | Promise<unknown>;

/** A registered ':name' pattern, split into literal + param segments. */
interface PatternRoute {
  method: string;
  segments: string[];
  handler: GatewayHandler;
}

function splitPath(path: string): string[] {
  return path.split('/').filter(Boolean);
}

export class MockGateway {
  private readonly routes = new Map<string, GatewayHandler>();
  private readonly patterns = new Map<string, PatternRoute>();

  /** Register a handler for "METHOD /path". */
  register(method: string, path: string, handler: GatewayHandler): void {
    this.routes.set(`${method} ${path}`, handler);
  }

  /**
   * Register a parameterized route. Two calling forms are accepted:
   *   gateway.registerPattern('GET', '/opportunities/:id', handler)
   *   gateway.registerPattern('GET /opportunities/:id', handler)
   * A pattern with no ':name' segments falls back to an exact
   * registration. Exact routes always win over patterns (handle()
   * checks exact first); among patterns, method + segment count must
   * match and the first registered pattern wins.
   */
  registerPattern(methodOrRoute: string, patternOrHandler: string | GatewayHandler, maybeHandler?: GatewayHandler): void {
    let method: string;
    let pathPattern: string;
    let handler: GatewayHandler;

    if (typeof patternOrHandler === 'function') {
      // Combined form: methodOrRoute is 'GET /opportunities/:id'.
      const space = methodOrRoute.indexOf(' ');
      if (space === -1) {
        throw new Error(`registerPattern: combined route missing method: "${methodOrRoute}"`);
      }
      method = methodOrRoute.slice(0, space).toUpperCase();
      pathPattern = methodOrRoute.slice(space + 1);
      handler = patternOrHandler;
    } else {
      method = methodOrRoute.toUpperCase();
      pathPattern = patternOrHandler;
      if (!maybeHandler) {
        throw new Error(`registerPattern: missing handler for ${method} ${pathPattern}`);
      }
      handler = maybeHandler;
    }

    const segments = splitPath(pathPattern);
    if (!segments.some((s) => s.startsWith(':'))) {
      this.register(method, pathPattern, handler);
      return;
    }
    this.patterns.set(`${method} ${pathPattern}`, { method, segments, handler });
  }

  /** The locked route list ("GET /items") — asserted by the spec. */
  get routesList(): string[] {
    return [...this.routes.keys(), ...this.patterns.keys()];
  }

  /**
   * Dispatch a request. `pathWithQuery` may carry "?a=1&b=2"; unknown
   * routes throw ApiError NOT_FOUND (conventions §Resource Errors).
   */
  async handle(method: string, pathWithQuery: string, body?: unknown): Promise<unknown> {
    const [path, queryString] = pathWithQuery.split('?');
    const key = `${method} ${path}`;
    const query: Record<string, string> = {};
    if (queryString) {
      const pair = (p: string): void => {
        const eq = p.indexOf('=');
        if (eq === -1) return;
        query[decodeURIComponent(p.slice(0, eq))] = decodeURIComponent(p.slice(eq + 1));
      };
      queryString.split('&').forEach(pair);
    }

    // Exact routes win over patterns.
    const exact = this.routes.get(key);
    if (exact) {
      return exact({ method, path, query, body, params: {} });
    }

    const match = this.matchPattern(method, path);
    if (!match) {
      throw new ApiError('NOT_FOUND', `No mock route for ${key}`);
    }
    return match.handler({ method, path, query, body, params: match.params });
  }

  /** First registered pattern with the same method + segment count wins. */
  private matchPattern(
    method: string,
    path: string,
  ): { params: Record<string, string>; handler: GatewayHandler } | null {
    const pathSegments = splitPath(path);
    for (const route of this.patterns.values()) {
      if (route.method !== method) continue;
      if (route.segments.length !== pathSegments.length) continue;
      const params: Record<string, string> = {};
      let ok = true;
      for (let i = 0; i < route.segments.length; i++) {
        const segment = route.segments[i];
        if (segment.startsWith(':')) {
          params[segment.slice(1)] = decodeURIComponent(pathSegments[i]);
        } else if (segment !== pathSegments[i]) {
          ok = false;
          break;
        }
      }
      if (ok) return { params, handler: route.handler };
    }
    return null;
  }
}
