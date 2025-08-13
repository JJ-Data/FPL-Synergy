// app/api/leaderboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getWeeklyPoints } from "@/lib/fpl";
import { withRateLimit, endpointRateLimiter } from "@/lib/rateLimiter";

const Query = z.object({
  gw: z.coerce.number().int().positive().max(38).optional(),
});

interface LeaderboardEntry {
  id: number;
  name: string;
  email: string;
  company: string | null;
  entryId: number;
  eventId: number;
  points: number;
  rank: number;
  error?: string;
}

async function getLeaderboardData(gw?: number): Promise<LeaderboardEntry[]> {
  // Get all approved users
  const users = await prisma.user.findMany({
    where: { status: "APPROVED" },
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      entryId: true,
    },
  });

  if (users.length === 0) {
    return [];
  }

  // Fetch points for all users in parallel with error handling
  const results = await Promise.allSettled(
    users.map(async (user) => {
      try {
        const { eventId, points } = await getWeeklyPoints(user.entryId, gw);
        return {
          ...user,
          eventId,
          points,
          rank: 0, // Will be set after sorting
        };
      } catch (error) {
        console.error(
          `Failed to get points for user ${user.name} (${user.entryId}):`,
          error
        );
        return {
          ...user,
          eventId: gw ?? 0,
          points: 0,
          rank: 0,
          error:
            error instanceof Error ? error.message : "Failed to fetch points",
        };
      }
    })
  );

  // Extract successful results and add error info for failed ones
  const leaderboard = results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      console.error(
        `Promise rejected for user ${users[index].name}:`,
        result.reason
      );
      return {
        ...users[index],
        eventId: gw ?? 0,
        points: 0,
        rank: 0,
        error: "Failed to fetch data",
      };
    }
  });

  // Sort by points (descending), then by name for tie-breaking
  leaderboard.sort((a, b) => {
    if (a.points !== b.points) {
      return b.points - a.points;
    }
    return a.name.localeCompare(b.name);
  });

  // Add ranking
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return leaderboard;
}

async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = Query.safeParse({
      gw: searchParams.get("gw") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parsed.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { gw } = parsed.data;
    const leaderboard = await getLeaderboardData(gw);

    // Separate successful entries from those with errors
    const successfulEntries = leaderboard.filter((entry) => !entry.error);
    const failedEntries = leaderboard.filter((entry) => entry.error);

    return NextResponse.json({
      leaderboard: successfulEntries,
      meta: {
        totalUsers: leaderboard.length,
        successfulFetches: successfulEntries.length,
        failedFetches: failedEntries.length,
        gameweek: gw ?? "current",
        timestamp: new Date().toISOString(),
      },
      ...(failedEntries.length > 0 && {
        warnings: failedEntries.map((entry) => ({
          user: entry.name,
          entryId: entry.entryId,
          error: entry.error,
        })),
      }),
    });
  } catch (error) {
    console.error("Leaderboard API error:", error);

    // Check if it's a database error
    if (error instanceof Error && error.message.includes("database")) {
      return NextResponse.json(
        {
          error: "Database connection failed",
          message: "Unable to connect to the database. Please try again later.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred while fetching the leaderboard.",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : "Unknown error",
        }),
      },
      { status: 500 }
    );
  }
}

// Apply rate limiting specifically for FPL endpoints
export const GET = withRateLimit(handler, (req) =>
  endpointRateLimiter.checkFPLEndpoint(req)
);
