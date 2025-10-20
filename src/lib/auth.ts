// Save as: src/lib/auth.ts

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as unknown as NextAuthOptions['adapter'],
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        userType: { label: "User Type", type: "text" }, // 'athlete' or 'trainer'
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        let user;
        let role;
        let userType;

        // First, try to find a trainer
        const trainer = await prisma.trainer.findUnique({
          where: { email: credentials.email },
        });

        if (trainer) {
          user = trainer;
          role = trainer.role;
          userType = "trainer";

          // Check if trainer is active
          if (!trainer.isActive) {
            throw new Error("Account is inactive");
          }
        } else {
          // If not a trainer, try to find an athlete
          const athlete = await prisma.athlete.findUnique({
            where: { email: credentials.email },
          });

          if (athlete) {
            user = athlete;
            role = "ATHLETE";
            userType = "athlete";

            // Check if athlete is approved
            if (!athlete.isApproved) {
              throw new Error("Account pending approval");
            }
          }
        }

        if (!user || !user.passwordHash) {
          throw new Error("Invalid credentials");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: role || 'ATHLETE',
          userType: userType || 'athlete',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.userType = user.userType;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.userType = token.userType as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};