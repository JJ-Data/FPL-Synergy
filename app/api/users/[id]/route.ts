import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const PatchBody = z.object({
  status: z.enum(["APPROVED", "BLOCKED"]),
  adminPassword: z.string().min(1),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const json = await req.json();
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  if (parsed.data.adminPassword !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { status: parsed.data.status },
    });
    return NextResponse.json(user);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  const { searchParams } = new URL(req.url);
  const adminPassword = searchParams.get("adminPassword");
  if (adminPassword !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
