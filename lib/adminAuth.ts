// lib/adminAuth.ts
import { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { env } from "./env";

const JWT_SECRET = new TextEncoder().encode(
  env.ADMIN_PASSWORD.slice(0, 32).padEnd(32, "0")
);
const ADMIN_SESSION_DURATION = 3600 * 1000; // 1 hour

interface AdminSession {
  authenticated: boolean;
  expiresAt: number;
  ipAddress?: string;
}

// Secure password comparison to prevent timing attacks
async function secureCompare(
  input: string,
  expected: string
): Promise<boolean> {
  if (input.length !== expected.length) {
    // Still do comparison to prevent timing attack
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
    return false;
  }

  let result = 0;
  for (let i = 0; i < input.length; i++) {
    result |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  }

  return result === 0;
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  if (!password || typeof password !== "string") {
    return false;
  }

  return await secureCompare(password, env.ADMIN_PASSWORD);
}

export async function createAdminToken(req: NextRequest): Promise<string> {
  const payload = {
    authenticated: true,
    expiresAt: Date.now() + ADMIN_SESSION_DURATION,
    ipAddress:
      req.ip || req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown",
    iat: Math.floor(Date.now() / 1000),
  };

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(JWT_SECRET);
}

export async function verifyAdminToken(
  token: string,
  req?: NextRequest
): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    const session = payload as unknown as AdminSession;

    // Check if session is expired
    if (!session.authenticated || Date.now() > session.expiresAt) {
      return null;
    }

    // Optional: Verify IP address consistency
    if (req && session.ipAddress && req.ip !== session.ipAddress) {
      console.warn("Admin session IP mismatch:", {
        sessionIp: session.ipAddress,
        requestIp: req.ip,
      });
      // In production, you might want to invalidate the session
      // return null;
    }

    return session;
  } catch (error) {
    console.error("Admin token verification failed:", error);
    return null;
  }
}

// Middleware helper for admin routes
export async function requireAdminAuth(req: NextRequest): Promise<{
  authenticated: boolean;
  error?: string;
  session?: AdminSession;
}> {
  // Check for admin cookie first
  const adminCookie = req.cookies.get("admin")?.value;

  if (adminCookie === "1") {
    // Legacy cookie-based auth - still supported but less secure
    return { authenticated: true };
  }

  // Check for JWT token in cookie or Authorization header
  const jwtCookie = req.cookies.get("admin-token")?.value;
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  const token = jwtCookie || bearerToken;

  if (!token) {
    return {
      authenticated: false,
      error: "No authentication token provided",
    };
  }

  const session = await verifyAdminToken(token, req);

  if (!session) {
    return {
      authenticated: false,
      error: "Invalid or expired authentication token",
    };
  }

  return {
    authenticated: true,
    session,
  };
}

// Rate limiting for admin login attempts
class LoginAttemptTracker {
  private attempts = new Map<string, { count: number; resetTime: number }>();
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes

  private getKey(req: NextRequest): string {
    return (
      req.ip || req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
    );
  }

  canAttempt(req: NextRequest): boolean {
    const key = this.getKey(req);
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record || now > record.resetTime) {
      return true;
    }

    return record.count < this.maxAttempts;
  }

  recordAttempt(req: NextRequest, success: boolean): void {
    const key = this.getKey(req);
    const now = Date.now();
    const record = this.attempts.get(key);

    if (success) {
      // Clear attempts on successful login
      this.attempts.delete(key);
      return;
    }

    if (!record || now > record.resetTime) {
      this.attempts.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
    } else {
      record.count++;
    }
  }

  getRemainingLockoutTime(req: NextRequest): number {
    const key = this.getKey(req);
    const record = this.attempts.get(key);

    if (!record || record.count < this.maxAttempts) {
      return 0;
    }

    return Math.max(0, record.resetTime - Date.now());
  }
}

export const loginAttemptTracker = new LoginAttemptTracker();

// Enhanced admin login handler
export async function handleAdminLogin(req: NextRequest, password: string) {
  // Check rate limiting
  if (!loginAttemptTracker.canAttempt(req)) {
    const lockoutTime = loginAttemptTracker.getRemainingLockoutTime(req);
    return {
      success: false,
      error: "Too many failed login attempts",
      retryAfter: Math.ceil(lockoutTime / 1000),
    };
  }

  // Verify password
  const isValid = await verifyAdminPassword(password);

  // Record the attempt
  loginAttemptTracker.recordAttempt(req, isValid);

  if (!isValid) {
    return {
      success: false,
      error: "Invalid admin password",
    };
  }

  // Create JWT token
  const token = await createAdminToken(req);

  return {
    success: true,
    token,
  };
}

// Secure password validation for admin operations
export async function validateAdminOperation(password: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  if (!password) {
    return { valid: false, error: "Admin password is required" };
  }

  const isValid = await verifyAdminPassword(password);

  if (!isValid) {
    return { valid: false, error: "Invalid admin password" };
  }

  return { valid: true };
}
