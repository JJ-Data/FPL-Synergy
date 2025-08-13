import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const PostBody = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  entryId: z.coerce.number().int().positive(),
  adminPassword: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as
    | "PENDING"
    | "APPROVED"
    | "BLOCKED"
    | null;
  const where = status ? { status } : {};
  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = PostBody.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const { name, email, company, entryId, adminPassword } = parsed.data;
  if (adminPassword !== process.env.ADMIN_PASSWORD)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const user = await prisma.user.create({
      data: { name, email, company, entryId, status: "APPROVED" },
    });
    return NextResponse.json(user);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
