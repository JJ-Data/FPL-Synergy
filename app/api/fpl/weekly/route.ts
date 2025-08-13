import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getWeeklyPoints } from "@/lib/fpl";

const Query = z.object({
  entryId: z.coerce.number().int().positive(),
  gw: z.coerce.number().int().positive().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = Query.safeParse({
      entryId: searchParams.get("entryId"),
      gw: searchParams.get("gw") ?? undefined,
    });
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });

    const { entryId, gw } = parsed.data;
    const result = await getWeeklyPoints(entryId, gw);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}
