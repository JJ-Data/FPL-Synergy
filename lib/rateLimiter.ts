// lib/rateLimiter.ts
import { NextRequest } from "next/server";
import { env } from "./env";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class InMemoryRateLimiter {
  private store: RateLimitStore = {};
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(
    maxRequests = env.RATE_LIMIT_REQUESTS,
    windowMs = env.RATE_LIMIT_WINDOW_MS
  ) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 300000);
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  private getIdentifier(req: NextRequest): string {
    // Try to get real IP from various headers (for production behind proxies)
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ip = forwarded?.split(",")[0] || realIp || req.ip || "unknown";

    // Include user agent to prevent simple IP spoofing
    const userAgent = req.headers.get("user-agent") || "unknown";

    return `${ip}:${userAgent.slice(0, 50)}`;
  }

  check(req: NextRequest): {
    success: boolean;
    limit: number;
    used: number;
    remaining: number;
    reset: number;
  } {
    const key = this.getIdentifier(req);
    const now = Date.now();

    if (!this.store[key] || this.store[key].resetTime < now) {
      this.store[key] = {
        count: 1,
        resetTime: now + this.windowMs,
      };

      return {
        success: true,
        limit: this.maxRequests,
        used: 1,
        remaining: this.maxRequests - 1,
        reset: this.store[key].resetTime,
      };
    }

    this.store[key].count++;

    const success = this.store[key].count <= this.maxRequests;

    return {
      success,
      limit: this.maxRequests,
      used: this.store[key].count,
      remaining: Math.max(0, this.maxRequests - this.store[key].count),
      reset: this.store[key].resetTime,
    };
  }
}

// Global instance
const rateLimiter = new InMemoryRateLimiter();

export function rateLimit(req: NextRequest) {
  return rateLimiter.check(req);
}

// Specific rate limiters for different endpoints
export class EndpointRateLimiter {
  private limiters = new Map<string, InMemoryRateLimiter>();

  private getLimiter(endpoint: string, maxRequests: number, windowMs: number) {
    if (!this.limiters.has(endpoint)) {
      this.limiters.set(
        endpoint,
        new InMemoryRateLimiter(maxRequests, windowMs)
      );
    }
    return this.limiters.get(endpoint)!;
  }

  checkFPLEndpoint(req: NextRequest) {
    // More restrictive for FPL API endpoints to avoid hitting their limits
    const limiter = this.getLimiter("fpl", 30, 60000); // 30 requests per minute
    return limiter.check(req);
  }

  checkAdminEndpoint(req: NextRequest) {
    // Very restrictive for admin endpoints
    const limiter = this.getLimiter("admin", 10, 60000); // 10 requests per minute
    return limiter.check(req);
  }

  checkRegistrationEndpoint(req: NextRequest) {
    // Moderate restriction for registration
    const limiter = this.getLimiter("registration", 5, 300000); // 5 requests per 5 minutes
    return limiter.check(req);
  }
}

export const endpointRateLimiter = new EndpointRateLimiter();

// Middleware helper function
export function createRateLimitResponse(result: ReturnType<typeof rateLimit>) {
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": new Date(result.reset).toISOString(),
        "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
      },
    }
  );
}

// Rate limit decorator for API routes
export function withRateLimit(
  handler: (req: NextRequest, ...args: any[]) => Promise<Response> | Response,
  limiterFn: (req: NextRequest) => ReturnType<typeof rateLimit> = rateLimit
) {
  return async (req: NextRequest, ...args: any[]) => {
    const result = limiterFn(req);

    if (!result.success) {
      return createRateLimitResponse(result);
    }

    const response = await handler(req, ...args);

    // Add rate limit headers to successful responses
    response.headers.set("X-RateLimit-Limit", result.limit.toString());
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    response.headers.set(
      "X-RateLimit-Reset",
      new Date(result.reset).toISOString()
    );

    return response;
  };
}
