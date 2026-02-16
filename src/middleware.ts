import { withAuth } from "next-auth/middleware";

// export default directly. Do not wrap it in another function.
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

// Define which paths this applies to
export const config = { 
  matcher: ["/admin/:path*"] 
};