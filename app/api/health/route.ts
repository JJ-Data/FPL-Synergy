// app/api/health/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Simplified health check with debug info
export async function GET() {
  try {
    // Debug environment variables first
    const envDebug = {
      DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
      DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0,
      DATABASE_URL_START:
        process.env.DATABASE_URL?.substring(0, 20) + "..." || "NONE",
      ALL_ENV_VARS: Object.keys(process.env).filter((key) =>
        key.includes("DATABASE")
      ),
      NODE_ENV: process.env.NODE_ENV || "unknown",
    };

    // Try database connection
    let dbStatus = "unknown";
    let dbError = null;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = "connected";
    } catch (error) {
      dbStatus = "failed";
      dbError = error instanceof Error ? error.message : "Unknown error";
    }

    return NextResponse.json({
      status: dbStatus === "connected" ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      environment: envDebug,
      database: {
        status: dbStatus,
        error: dbError,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        environment: {
          DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
        },
      },
      { status: 500 }
    );
  }
}
