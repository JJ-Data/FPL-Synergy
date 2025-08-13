// app/api/health/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkFPLAPIHealth } from "@/lib/fpl";
import { getEnvironmentStatus } from "@/lib/env";

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  environment: string;
  services: {
    database: {
      status: "ok" | "error";
      message: string;
      responseTime?: number;
    };
    fplApi: {
      status: "ok" | "error";
      message: string;
      responseTime?: number;
    };
    environment: {
      status: "ok" | "error";
      message: string;
      config?: any;
    };
  };
  stats?: {
    totalUsers: number;
    approvedUsers: number;
    pendingUsers: number;
  };
}

async function checkDatabase(): Promise<{
  status: "ok" | "error";
  message: string;
  responseTime?: number;
}> {
  const startTime = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    return {
      status: "ok",
      message: "Database connection successful",
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: "error",
      message: `Database connection failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      responseTime,
    };
  }
}

async function getUserStats() {
  try {
    const [total, approved, pending] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "APPROVED" } }),
      prisma.user.count({ where: { status: "PENDING" } }),
    ]);

    return {
      totalUsers: total,
      approvedUsers: approved,
      pendingUsers: pending,
    };
  } catch (error) {
    console.error("Failed to get user stats:", error);
    return null;
  }
}

export async function GET() {
  const startTime = Date.now();

  try {
    // Check all services in parallel
    const [dbHealth, fplHealth, envStatus] = await Promise.all([
      checkDatabase(),
      checkFPLAPIHealth(),
      Promise.resolve(getEnvironmentStatus()),
    ]);

    // Get user stats (optional, don't fail health check if this fails)
    const stats = await getUserStats();

    // Determine overall health status
    const hasError =
      dbHealth.status === "error" ||
      fplHealth.status === "error" ||
      !envStatus.isValid;
    const status: HealthCheckResult["status"] = hasError
      ? "unhealthy"
      : "healthy";

    const healthCheck: HealthCheckResult = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: envStatus.environment,
      services: {
        database: dbHealth,
        fplApi: {
          status: fplHealth.status,
          message: fplHealth.message,
          responseTime:
            fplHealth.status === "ok" ? Date.now() - startTime : undefined,
        },
        environment: {
          status: envStatus.isValid ? "ok" : "error",
          message: envStatus.isValid
            ? "All environment variables valid"
            : `Missing: ${envStatus.errors.join(", ")}`,
          ...(process.env.NODE_ENV === "development" && {
            config: envStatus.config,
          }),
        },
      },
      ...(stats && { stats }),
    };

    const httpStatus = status === "unhealthy" ? 503 : 200;

    return NextResponse.json(healthCheck, {
      status: httpStatus,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Health check failed:", error);

    const errorResponse: HealthCheckResult = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "unknown",
      services: {
        database: { status: "error", message: "Health check failed" },
        fplApi: { status: "error", message: "Health check failed" },
        environment: { status: "error", message: "Health check failed" },
      },
    };

    return NextResponse.json(errorResponse, {
      status: 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  }
}
