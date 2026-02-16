// src/app/api/auth/[...nextauth]/route.ts
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
          where: { email: credentials.email }
        });

        if (!user) {
          // Returning null usually implies "User not found" generic error
          throw new Error("Invalid credentials"); 
        }

        // 1. CHECK LOCKOUT STATUS
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
          const now = new Date();
          const diff = user.lockoutUntil.getTime() - now.getTime();
          const minutesLeft = Math.ceil(diff / 60000); // Convert ms to minutes
          throw new Error(`Locked out. Try again in ${minutesLeft} minute(s).`);
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        // 2. HANDLE INVALID PASSWORD (PENALTY LOGIC)
        if (!isPasswordValid) {
          const newAttempts = user.failedAttempts + 1;
          let newLockout = null;

          // If attempts hit 4 or more, apply exponential lockout
          // 4th try = 1 min, 5th = 2 mins, 6th = 4 mins, etc.
          if (newAttempts >= 4) {
            const penaltyMinutes = Math.pow(2, newAttempts - 4); 
            newLockout = new Date(Date.now() + penaltyMinutes * 60000);
          }

          // Update user failure stats
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

        return { id: user.id, email: user.email };
      }
    })
  ],
  pages: {
    signIn: "/login",
    error: "/login" // Redirect back to login page on error
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };