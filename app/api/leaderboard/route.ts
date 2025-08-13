import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getWeeklyPoints } from "@/lib/fpl";

const Query = z.object({ gw: z.coerce.number().int().positive().optional() });

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = Query.safeParse({ gw: searchParams.get("gw") ?? undefined });
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  const gw = parsed.data.gw;

  const users = await prisma.user.findMany({ where: { status: "APPROVED" } });
  const rows = await Promise.all(
    users.map(async (u) => {
      try {
        const { eventId, points } = await getWeeklyPoints(u.entryId, gw);
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          company: u.company,
          entryId: u.entryId,
          eventId,
          points,
        };
      } catch {
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          company: u.company,
          entryId: u.entryId,
          eventId: gw ?? 0,
          points: 0,
        };
      }
    })
  );

  rows.sort((a, b) => b.points - a.points);
  return NextResponse.json({ leaderboard: rows });
}
