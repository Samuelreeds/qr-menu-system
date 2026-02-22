import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { shopUsers: true } // Crucial for multi-tenant mapping
        });

        if (!user) {
          throw new Error("Invalid credentials"); 
        }

        // 1. CHECK LOCKOUT STATUS
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
          const now = new Date();
          const diff = user.lockoutUntil.getTime() - now.getTime();
          const minutesLeft = Math.ceil(diff / 60000);
          throw new Error(`Locked out. Try again in ${minutesLeft} minute(s).`);
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        // 2. HANDLE INVALID PASSWORD (PENALTY LOGIC)
        if (!isPasswordValid) {
          const newAttempts = user.failedAttempts + 1;
          let newLockout = null;

          if (newAttempts >= 4) {
            const penaltyMinutes = Math.pow(2, newAttempts - 4); 
            newLockout = new Date(Date.now() + penaltyMinutes * 60000);
          }

          await prisma.user.update({
            where: { id: user.id },
            data: { 
              failedAttempts: newAttempts,
              lockoutUntil: newLockout 
            }
          });

          if (newLockout) {
             const minutes = Math.pow(2, newAttempts - 4);
             throw new Error(`Too many attempts. Locked for ${minutes} minute(s).`);
          } else {
             const remaining = 4 - newAttempts;
             throw new Error(`Invalid password. ${remaining} attempts remaining.`);
          }
        }

        // 3. SUCCESS: RESET FAILURES
        await prisma.user.update({
          where: { id: user.id },
          data: { failedAttempts: 0, lockoutUntil: null }
        });

        return { 
          id: user.id, 
          email: user.email,
          // Attach shop info to the session object
          shopId: user.shopUsers[0]?.shopId || null 
        };
      }
    })
  ],
  callbacks: {
    // Inject shopId into the JWT and Session
    async jwt({ token, user }: any) {
      if (user) {
        token.shopId = user.shopId;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.shopId = token.shopId;
      }
      return session;
    }
  },
  pages: {
    // UPDATED PATH: Points to your new auth/login location
    signIn: "/auth/login",
    error: "/auth/login" 
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };