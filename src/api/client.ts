/**
 * Fetch-based AniList GraphQL client.
 *
 * - Bearer token from a getter registered by src/auth (`setTokenGetter`).
 * - Normalises AniList `errors` arrays and HTTP failures into `AniListError`.
 * - 401 / "Invalid token" responses call the handler set with `setOnUnauthorized`.
 * - 429 rate limits are retried using Retry-After / X-RateLimit-Reset, with
 *   exponential backoff for transient 5xx and network errors.
 * - Honours AbortSignal (TanStack Query passes one to every queryFn).
 */

export const ANILIST_GRAPHQL_URL = 'https://graphql.anilist.co';

type TokenGetter = () => string | null | Promise<string | null>;

let tokenGetter: TokenGetter = () => null;
let onUnauthorized: (() => void) | null = null;
let rateLimitListener: ((info: RateLimitInfo) => void) | null = null;

/** Registered by src/auth. Return `null` when logged out. */
export function setTokenGetter(fn: () => string | null): void;
export function setTokenGetter(fn: TokenGetter): void;
export function setTokenGetter(fn: TokenGetter) {
  tokenGetter = fn;
}

/** Called once per unauthorized response (expired/revoked token). */
export function setOnUnauthorized(fn: (() => void) | null) {
  onUnauthorized = fn;
}

export interface RateLimitInfo {
  limit: number | null;
  remaining: number | null;
  /** Unix seconds when the window resets, if provided. */
  reset: number | null;
}

/** Optional observer for rate limit headers (e.g. to show a banner). */
export function setRateLimitListener(fn: ((info: RateLimitInfo) => void) | null) {
  rateLimitListener = fn;
}

let lastRateLimit: RateLimitInfo = { limit: null, remaining: null, reset: null };
export function getLastRateLimit(): RateLimitInfo {
  return lastRateLimit;
}

export interface GraphQLErrorEntry {
  message: string;
  status?: number;
  locations?: { line: number; column: number }[];
  validation?: Record<string, string[]>;
  [key: string]: unknown;
}

export type AniListErrorKind =
  | 'unauthorized'
  | 'not_found'
  | 'rate_limited'
  | 'validation'
  | 'graphql'
  | 'http'
  | 'network'
  | 'aborted';

export class AniListError extends Error {
  readonly kind: AniListErrorKind;
  readonly status: number | null;
  readonly errors: GraphQLErrorEntry[];
  /** Partial data returned alongside errors, if any. */
  readonly data: unknown;
  readonly retryAfterMs: number | null;

  constructor(opts: {
    message: string;
    kind: AniListErrorKind;
    status?: number | null;
    errors?: GraphQLErrorEntry[];
    data?: unknown;
    retryAfterMs?: number | null;
    cause?: unknown;
  }) {
    super(opts.message);
    this.name = 'AniListError';
    this.kind = opts.kind;
    this.status = opts.status ?? null;
    this.errors = opts.errors ?? [];
    this.data = opts.data ?? null;
    this.retryAfterMs = opts.retryAfterMs ?? null;
    if (opts.cause !== undefined) (this as { cause?: unknown }).cause = opts.cause;
  }

  get isUnauthorized() {
    return this.kind === 'unauthorized';
  }
  get isNotFound() {
    return this.kind === 'not_found';
  }
  get isRateLimited() {
    return this.kind === 'rate_limited';
  }
}

export function isAniListError(e: unknown): e is AniListError {
  return e instanceof AniListError;
}

/**
 * TanStack Query `retry` policy that knows about `AniListError`.
 * `gql()` already retries 429 / 5xx / network failures internally, so at the query level we only
 * give transient failures (network / http) one more go and never retry auth, 404, validation,
 * GraphQL, aborted or rate-limit errors (retrying a 429 here would just burn more of the budget).
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (isAniListError(error)) {
    return (error.kind === 'network' || error.kind === 'http') && failureCount < 1;
  }
  return failureCount < 2;
}

export interface GqlOptions {
  signal?: AbortSignal;
  /** Skip the Authorization header even when logged in. */
  anonymous?: boolean;
  /** Max retries on 429 / 5xx / network errors (default 3). */
  maxRetries?: number;
  /** Return partial data instead of throwing when `data` is non-null alongside `errors`. */
  allowPartial?: boolean;
}

const DEFAULT_MAX_RETRIES = 3;
const MAX_RATE_LIMIT_WAIT_MS = 65_000;

function abortError(signal?: AbortSignal) {
  const reason = signal?.reason;
  return new AniListError({
    message: reason instanceof Error ? reason.message : 'Request aborted',
    kind: 'aborted',
    cause: reason,
  });
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError(signal));
    const t = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(abortError(signal));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function num(v: string | null): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function readRateLimit(headers: Headers): RateLimitInfo {
  return {
    limit: num(headers.get('x-ratelimit-limit')),
    remaining: num(headers.get('x-ratelimit-remaining')),
    reset: num(headers.get('x-ratelimit-reset')),
  };
}

function retryDelayFromHeaders(headers: Headers, attempt: number): number {
  const retryAfter = headers.get('retry-after');
  if (retryAfter) {
    const secs = Number(retryAfter);
    if (Number.isFinite(secs)) return Math.max(secs * 1000, 500);
    const date = Date.parse(retryAfter);
    if (!Number.isNaN(date)) return Math.max(date - Date.now(), 500);
  }
  const reset = num(headers.get('x-ratelimit-reset'));
  if (reset) {
    const ms = reset * 1000 - Date.now();
    if (ms > 0) return ms + 250;
  }
  return backoff(attempt) + 1000;
}

function backoff(attempt: number) {
  const base = 500 * 2 ** attempt;
  return base + Math.floor(Math.random() * 250);
}

/** Strip undefined/null top-level variables: AniList treats absent args as "no filter". */
function cleanVariables(vars?: object): Record<string, unknown> | undefined {
  if (!vars) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v) && v.length === 0 && k.endsWith('_in')) continue;
    out[k] = v;
  }
  return out;
}

function isUnauthorizedError(status: number, errors: GraphQLErrorEntry[]) {
  if (status === 401) return true;
  return errors.some(
    (e) => e.status === 401 || /invalid token|unauthori[sz]ed/i.test(e.message ?? ''),
  );
}

function classify(status: number, errors: GraphQLErrorEntry[]): AniListErrorKind {
  if (isUnauthorizedError(status, errors)) return 'unauthorized';
  if (status === 429 || errors.some((e) => e.status === 429)) return 'rate_limited';
  if (status === 404 || errors.some((e) => e.status === 404)) return 'not_found';
  if (errors.some((e) => e.validation)) return 'validation';
  if (errors.length) return 'graphql';
  return 'http';
}

/**
 * Execute a GraphQL operation against AniList.
 *
 * @example
 *   const data = await gql<MediaDetailQuery>(MEDIA_DETAIL_QUERY, { id: 1 }, { signal });
 */
export async function gql<TData, TVars extends object = object>(
  query: string,
  variables?: TVars,
  options: GqlOptions = {},
): Promise<TData> {
  const { signal, anonymous = false, maxRetries = DEFAULT_MAX_RETRIES, allowPartial = false } =
    options;
  const body = JSON.stringify({ query, variables: cleanVariables(variables) });

  for (let attempt = 0; ; attempt++) {
    if (signal?.aborted) throw abortError(signal);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    const token = anonymous ? null : await tokenGetter();
    if (token) headers.Authorization = `Bearer ${token}`;

    let res: Response;
    try {
      res = await fetch(ANILIST_GRAPHQL_URL, { method: 'POST', headers, body, signal });
    } catch (e) {
      if (signal?.aborted) throw abortError(signal);
      if (attempt < maxRetries) {
        await sleep(backoff(attempt), signal);
        continue;
      }
      throw new AniListError({
        message: e instanceof Error ? e.message : 'Network request failed',
        kind: 'network',
        cause: e,
      });
    }

    const rl = readRateLimit(res.headers);
    if (rl.limit != null || rl.remaining != null) {
      lastRateLimit = rl;
      rateLimitListener?.(rl);
    }

    if (res.status === 429) {
      const wait = retryDelayFromHeaders(res.headers, attempt);
      if (attempt < maxRetries && wait <= MAX_RATE_LIMIT_WAIT_MS) {
        await sleep(wait, signal);
        continue;
      }
      throw new AniListError({
        message: 'AniList rate limit exceeded. Try again in a moment.',
        kind: 'rate_limited',
        status: 429,
        retryAfterMs: wait,
      });
    }

    if (res.status >= 500 && attempt < maxRetries) {
      await sleep(backoff(attempt), signal);
      continue;
    }

    let json: { data?: TData | null; errors?: GraphQLErrorEntry[] } | null = null;
    try {
      json = await res.json();
    } catch (e) {
      if (signal?.aborted) throw abortError(signal);
      throw new AniListError({
        message: `AniList returned an invalid response (HTTP ${res.status})`,
        kind: res.status === 401 ? 'unauthorized' : 'http',
        status: res.status,
        cause: e,
      });
    }

    const errors = json?.errors ?? [];
    const data = json?.data ?? null;

    if (errors.length || !res.ok) {
      const kind = classify(res.status, errors);
      if (kind === 'unauthorized' && token) onUnauthorized?.();
      if (allowPartial && data && kind !== 'unauthorized') return data;
      throw new AniListError({
        message: errors.map((e) => e.message).join('\n') || `HTTP ${res.status}`,
        kind,
        status: errors[0]?.status ?? res.status,
        errors,
        data,
      });
    }

    return data as TData;
  }
}
