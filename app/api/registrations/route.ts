import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const Body = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  entryId: z.coerce.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = Body.safeParse(json);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const { name, email, company, entryId } = parsed.data;
    const user = await prisma.user.create({
      data: { name, email, company, entryId, status: "PENDING" },
    });
    return NextResponse.json({ ok: true, id: user.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
