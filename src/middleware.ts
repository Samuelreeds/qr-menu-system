import { withAuth } from "next-auth/middleware";
import { NextRequest } from "next/dist/server/web/spec-extension/request";

export function proxy(request: NextRequest){
  return withAuth(request, {
    pages: {
      signIn: "/login",
    },
  });
}

// This ensures only the /admin routes are protected
export const config = { matcher: ["/admin/:path*"] };