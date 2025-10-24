import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'athlete-credentials',
      name: 'Athlete Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const athlete = await prisma.athlete.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            approvedByTrainer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        if (!athlete) {
          throw new Error('Invalid email or password');
        }

        if (!athlete.isApproved) {
          throw new Error('Your account is pending approval');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, athlete.passwordHash);

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: athlete.id,
          email: athlete.email,
          name: `${athlete.firstName} ${athlete.lastName}`,
          role: UserRole.ATHLETE,
        };
      },
    }),
    CredentialsProvider({
      id: 'trainer-credentials',
      name: 'Trainer Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const trainer = await prisma.trainer.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!trainer) {
          throw new Error('Invalid email or password');
        }

        if (!trainer.isActive) {
          throw new Error('Your account has been deactivated');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, trainer.passwordHash);

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: trainer.id,
          email: trainer.email,
          name: `${trainer.firstName} ${trainer.lastName}`,
          role: trainer.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};