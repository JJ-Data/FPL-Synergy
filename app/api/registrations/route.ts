import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { withRateLimit, endpointRateLimiter } from "@/lib/rateLimiter";

const Body = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  entryId: z.coerce
    .number()
    .int()
    .positive("Entry ID must be a positive number"),
});

async function handler(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = Body.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid payload",
          details: parsed.error.errors,
        },
        { status: 400 }
      );
    }

    const { name, email, company, entryId } = parsed.data;

    // Check if email or entryId already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { entryId }],
      },
    });

    if (existing) {
      const field = existing.email === email ? "email" : "FPL Team ID";
      return NextResponse.json(
        {
          error: `This ${field} is already registered`,
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: { name, email, company, entryId, status: "PENDING" },
    });

    return NextResponse.json({ ok: true, id: user.id });
  } catch (e: any) {
    console.error("Registration error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const POST = withRateLimit(handler, (req) =>
  endpointRateLimiter.checkRegistrationEndpoint(req)
);
