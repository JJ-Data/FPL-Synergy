import { NextResponse } from "next/server";
import { handleAdminLogin } from "@/lib/adminAuth";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    const result = await handleAdminLogin(req as any, password);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          ...(result.retryAfter && { retryAfter: result.retryAfter }),
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true });

    // Set both legacy cookie and new JWT token
    response.cookies.set("admin", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 3600, // 1 hour
    });

    response.cookies.set("admin-token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 3600, // 1 hour
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
