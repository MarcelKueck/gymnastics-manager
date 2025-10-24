import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Find user with both profiles
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            athleteProfile: true,
            trainerProfile: true,
          },
        });

        if (!user) {
          throw new Error('Invalid email or password');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        // Build roles array based on profiles
        const roles: UserRole[] = [];
        let isAthlete = false;
        let isTrainer = false;
        let isAdmin = false;

        // Check athlete profile
        if (user.athleteProfile) {
          if (!user.athleteProfile.isApproved) {
            throw new Error('Your account is pending approval');
          }
          roles.push(UserRole.ATHLETE);
          isAthlete = true;
        }

        // Check trainer profile
        if (user.trainerProfile) {
          if (!user.trainerProfile.isActive) {
            throw new Error('Your account has been deactivated');
          }
          roles.push(user.trainerProfile.role); // TRAINER or ADMIN
          isTrainer = true;
          if (user.trainerProfile.role === UserRole.ADMIN) {
            isAdmin = true;
          }
        }

        // Must have at least one active role
        if (roles.length === 0) {
          throw new Error('No active profiles found');
        }

        // Determine default active role
        // Priority: ADMIN > TRAINER > ATHLETE
        let activeRole: UserRole;
        if (isAdmin) {
          activeRole = UserRole.ADMIN;
        } else if (isTrainer) {
          activeRole = UserRole.TRAINER;
        } else {
          activeRole = UserRole.ATHLETE;
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          roles,
          activeRole,
          isAthlete,
          isTrainer,
          isAdmin,
          athleteProfileId: user.athleteProfile?.id,
          trainerProfileId: user.trainerProfile?.id,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
        token.activeRole = user.activeRole;
        token.isAthlete = user.isAthlete;
        token.isTrainer = user.isTrainer;
        token.isAdmin = user.isAdmin;
        token.athleteProfileId = user.athleteProfileId;
        token.trainerProfileId = user.trainerProfileId;
      }

      // Handle role switching via session update
      if (trigger === 'update' && session?.activeRole) {
        token.activeRole = session.activeRole;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roles = token.roles as UserRole[];
        session.user.activeRole = token.activeRole as UserRole;
        session.user.isAthlete = token.isAthlete as boolean;
        session.user.isTrainer = token.isTrainer as boolean;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.athleteProfileId = token.athleteProfileId as string | undefined;
        session.user.trainerProfileId = token.trainerProfileId as string | undefined;
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