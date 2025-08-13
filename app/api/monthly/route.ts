import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Helpers to get FPL data
async function getBootstrap() {
  const res = await fetch(
    "https://fantasy.premierleague.com/api/bootstrap-static/",
    { next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error("bootstrap-static failed");
  return res.json() as Promise<{
    events: { id: number; deadline_time: string }[];
  }>;
}
async function getEntryHistory(entryId: number) {
  const res = await fetch(
    `https://fantasy.premierleague.com/api/entry/${entryId}/history/`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("entry history failed");
  return res.json() as Promise<{
    current: { event: number; points: number; total_points: number }[];
  }>;
}

const Query = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = Query.safeParse({
      year: searchParams.get("year"),
      month: searchParams.get("month"),
    });
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });

    const { year, month } = parsed.data;
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    const bootstrap = await getBootstrap();
    const monthEventIds = bootstrap.events
      .filter((e) => {
        const d = new Date(e.deadline_time);
        return d >= start && d <= end;
      })
      .map((e) => e.id);

    // Fallback: if no events mapped (e.g., pre-season), return empty
    if (monthEventIds.length === 0) {
      return NextResponse.json({
        monthEventIds: [],
        leaderboard: [],
        winner: null,
      });
    }

    const users = await prisma.user.findMany({
      where: { status: "APPROVED" } as any,
    });

    const rows = await Promise.all(
      users.map(async (u) => {
        try {
          const h = await getEntryHistory(u.entryId);
          const map = new Map(h.current.map((r) => [r.event, r]));
          const monthPoints = monthEventIds.reduce(
            (sum, id) => sum + (map.get(id)?.points ?? 0),
            0
          );
          const gwWins = monthEventIds.reduce(
            (wins, id) => wins + ((map.get(id)?.points ?? -1) >= 0 ? 0 : 0),
            0
          ); // placeholder; computed later once all rows are known
          const seasonTotal = h.current.at(-1)?.total_points ?? 0;
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            company: u.company,
            entryId: u.entryId,
            monthPoints,
            seasonTotal,
            perGw: monthEventIds.map((id) => ({
              id,
              pts: map.get(id)?.points ?? 0,
            })),
          };
        } catch {
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            company: u.company,
            entryId: u.entryId,
            monthPoints: 0,
            seasonTotal: 0,
            perGw: monthEventIds.map((id) => ({ id, pts: 0 })),
          };
        }
      })
    );

    // Compute GW wins within the month (per-user count of being top in a GW)
    const gwTopCounts = new Map<number, number>();
    for (const gw of monthEventIds) {
      let max = -Infinity;
      for (const r of rows)
        max = Math.max(max, r.perGw.find((g) => g.id === gw)?.pts ?? 0);
      const winners = rows.filter(
        (r) => (r.perGw.find((g) => g.id === gw)?.pts ?? 0) === max
      );
      for (const w of winners) {
        gwTopCounts.set(w.id, (gwTopCounts.get(w.id) ?? 0) + 1);
      }
    }
    for (const r of rows) {
      (r as any).gwWins = gwTopCounts.get(r.id) ?? 0;
    }

    // Sort by rules: month points desc, season total desc, gwWins desc
    rows.sort(
      (a, b) =>
        b.monthPoints - a.monthPoints ||
        b.seasonTotal - a.seasonTotal ||
        (b as any).gwWins - (a as any).gwWins
    );

    const winner = rows[0] ?? null;

    return NextResponse.json({
      monthEventIds,
      leaderboard: rows.map((r, i) => ({ rank: i + 1, ...r })),
      winner,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}
