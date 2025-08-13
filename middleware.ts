import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  // Protect /admin page and user-management APIs
  const isAdminPage =
    url.pathname.startsWith("/admin") && url.pathname !== "/admin/login";
  const isUserMgmtApi = url.pathname.startsWith("/api/users");

  if (isAdminPage || isUserMgmtApi) {
    const cookie = req.cookies.get("admin");
    if (!cookie || cookie.value !== "1") {
      // redirect to login for pages; 401 for APIs
      if (isAdminPage) {
        const loginUrl = new URL("/admin/login", req.url);
        return NextResponse.redirect(loginUrl);
      }
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/users/:path*"],
};
