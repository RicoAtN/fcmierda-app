import { neon } from "@neondatabase/serverless";

/**
 * Circuit Breaker States
 */
export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerConfig {
  failureThreshold: number; // consecutive failures before tripping
  cooldownPeriodMs: number; // ms to stay in OPEN state before trying HALF_OPEN
  maxRetries: number; // max retry attempts per query (strict max 2)
  retryDelayMs: number; // initial backoff delay
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 3,
  cooldownPeriodMs: 60000, // 60 seconds
  maxRetries: 2, // Maximum 2 retry attempts
  retryDelayMs: 200,
};

class NeonCircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private lastFailureTime = 0;
  private lastAlertTime = 0;
  private readonly config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  public getState(): CircuitState {
    if (this.state === "OPEN") {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.config.cooldownPeriodMs) {
        this.state = "HALF_OPEN";
        console.warn(
          "[NEON_DB_ALERT] Circuit breaker transitioning from OPEN to HALF_OPEN. Testing single probe query..."
        );
      }
    }
    return this.state;
  }

  public isOpen(): boolean {
    return this.getState() === "OPEN";
  }

  public getCooldownRemainingMs(): number {
    if (this.state !== "OPEN") return 0;
    const elapsed = Date.now() - this.lastFailureTime;
    return Math.max(0, this.config.cooldownPeriodMs - elapsed);
  }

  public recordSuccess() {
    if (this.state === "HALF_OPEN") {
      console.log(
        "[NEON_DB_ALERT] Probe query succeeded. Database connection recovered! Circuit breaker is now CLOSED."
      );
    }
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  public recordFailure(error: unknown) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    const errorMsg = error instanceof Error ? error.message : String(error);
    const isFatalQuotaError = this.isQuotaOrAuthError(errorMsg);

    if (isFatalQuotaError || this.failureCount >= this.config.failureThreshold) {
      this.state = "OPEN";
      const now = Date.now();
      // Throttle loud alerts to once every 10 seconds
      if (now - this.lastAlertTime > 10000) {
        this.lastAlertTime = now;
        console.error(
          `\n🚨 [NEON_DB_ALERT] CIRCUIT BREAKER TRIPPED (OPEN)!\n` +
          `   Reason: ${isFatalQuotaError ? "FATAL NEON QUOTA / AUTH LIMIT EXCEEDED" : `Failed ${this.failureCount} consecutive queries`}\n` +
          `   Error details: ${errorMsg}\n` +
          `   Action: Completely HALTING all database queries for ${Math.round(this.config.cooldownPeriodMs / 1000)}s to prevent network/resource exhaustion.\n` +
          `   Status: Returning fallback data.\n`
        );
      }
    } else {
      console.warn(
        `[NEON_DB_ALERT] Query failure recorded (${this.failureCount}/${this.config.failureThreshold}): ${errorMsg}`
      );
    }
  }

  private isQuotaOrAuthError(msg: string): boolean {
    const lower = msg.toLowerCase();
    return (
      lower.includes("402") ||
      lower.includes("quota") ||
      lower.includes("exceeded") ||
      lower.includes("blocked") ||
      lower.includes("suspended") ||
      lower.includes("payment required") ||
      lower.includes("password authentication failed") ||
      lower.includes("too many connections") ||
      lower.includes("connection limit") ||
      lower.includes("rate limit") ||
      lower.includes("too many requests")
    );
  }
}

// Global Circuit Breaker Singleton across serverless invocations
const globalForCircuit = globalThis as unknown as {
  neonCircuitBreaker?: NeonCircuitBreaker;
};

export const circuitBreaker =
  globalForCircuit.neonCircuitBreaker || new NeonCircuitBreaker();
globalForCircuit.neonCircuitBreaker = circuitBreaker;

function getDbUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url || !url.trim()) {
    throw new Error("DATABASE_URL environment variable is not configured.");
  }
  return url.trim();
}

/**
 * Execute a query with max 2 retries and circuit breaker protection
 */
async function executeWithCircuitBreaker<T>(
  queryFn: (client: any) => Promise<T>
): Promise<T> {
  if (circuitBreaker.isOpen()) {
    const remaining = Math.round(circuitBreaker.getCooldownRemainingMs() / 1000);
    throw new Error(
      `[NEON_DB_ALERT] Circuit breaker is OPEN. Query halted to protect database quotas. Try again in ${remaining}s.`
    );
  }

  const dbUrl = getDbUrl();
  const client = neon(dbUrl);

  let lastError: unknown = null;
  const maxAttempts = DEFAULT_CONFIG.maxRetries; // max 2 attempts total (1 initial + 1 retry)

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await queryFn(client);
      circuitBreaker.recordSuccess();
      return result;
    } catch (err: unknown) {
      lastError = err;
      const isFatal =
        err instanceof Error &&
        (err.message.includes("quota") ||
          err.message.includes("blocked") ||
          err.message.includes("402") ||
          err.message.includes("auth"));

      // Do not retry on fatal quota/auth errors
      if (isFatal || attempt >= maxAttempts) {
        break;
      }

      // Exponential backoff with jitter
      const delay = DEFAULT_CONFIG.retryDelayMs * Math.pow(2, attempt - 1) + Math.random() * 50;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All attempts exhausted
  circuitBreaker.recordFailure(lastError);
  throw lastError;
}

/**
 * Main Tagged Template Query Function
 * Supports both sql<User>`...` and sql<User[]>`...`
 */
export async function sql<T = any>(
  strings: TemplateStringsArray | string,
  ...values: any[]
): Promise<T extends any[] ? T : T[]> {
  // If called as a normal function with a string: sql("SELECT ...", [params])
  if (typeof strings === "string") {
    const queryText = strings;
    const params = values[0] || [];
    return executeWithCircuitBreaker(async (client) => {
      // Use parameterized query
      const res = await client(queryText, params);
      return (res || []) as (T extends any[] ? T : T[]);
    });
  }

  // Called as tagged template literal: sql`SELECT ... ${val}`
  return executeWithCircuitBreaker(async (client) => {
    const res = await client(strings, ...values);
    return (res || []) as (T extends any[] ? T : T[]);
  });
}

/**
 * Parameterized Query Helper
 */
export async function dbQuery<T = any>(
  queryText: string,
  params: any[] = []
): Promise<T extends any[] ? T : T[]> {
  return executeWithCircuitBreaker(async (client) => {
    const res = params.length > 0 ? await client(queryText, params) : await client(queryText);
    return (res || []) as (T extends any[] ? T : T[]);
  });
}

/**
 * Safe query helper that returns fallback instead of throwing when DB is offline/blocked
 */
export async function safeDbQuery<T = any>(
  queryFn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await queryFn();
  } catch (err) {
    console.warn("[safeDbQuery] Error suppressed, returning fallback data:", err instanceof Error ? err.message : err);
    return fallback;
  }
}

export default sql;
