import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

// This ensures only the /admin routes are protected
export const config = { matcher: ["/admin/:path*"] };