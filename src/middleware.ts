import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// export default directly. Do not wrap it in another function.
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Protect SuperAdmin routes at the middleware level
    if (path.startsWith("/superadmin")) {
      if (token?.role !== "SUPERADMIN" && token?.isSuperAdmin !== true) {
        // Logged in but unauthorized for superadmin -> redirect to home
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  },
  {
    pages: {
      signIn: "/auth/login",
    },
  }
);

// Define which paths this applies to
export const config = { 
  matcher: ["/admin/:path*", "/superadmin/:path*"] 
};