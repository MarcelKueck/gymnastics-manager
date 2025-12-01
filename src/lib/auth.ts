import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      roles: ('ATHLETE' | 'TRAINER' | 'ADMIN')[];
      activeRole: 'ATHLETE' | 'TRAINER' | 'ADMIN';
      athleteProfileId?: string;
      trainerProfileId?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: ('ATHLETE' | 'TRAINER' | 'ADMIN')[];
    athleteProfileId?: string;
    trainerProfileId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: ('ATHLETE' | 'TRAINER' | 'ADMIN')[];
    activeRole: 'ATHLETE' | 'TRAINER' | 'ADMIN';
    athleteProfileId?: string;
    trainerProfileId?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('E-Mail und Passwort erforderlich');
        }

        // Find user with profiles
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            athleteProfile: true,
            trainerProfile: true,
          },
        });

        if (!user) {
          throw new Error('Ungültige Anmeldedaten');
        }

        // Verify password
        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          throw new Error('Ungültige Anmeldedaten');
        }

        // Check if athlete is approved
        if (user.isAthlete && user.athleteProfile && user.athleteProfile.status !== 'ACTIVE') {
          // If only athlete role and not approved, deny
          if (!user.isTrainer) {
            throw new Error('Ihr Konto wurde noch nicht genehmigt');
          }
        }

        // Build roles array
        const roles: ('ATHLETE' | 'TRAINER' | 'ADMIN')[] = [];

        if (user.isAthlete && user.athleteProfile?.status === 'ACTIVE') {
          roles.push('ATHLETE');
        }

        if (user.isTrainer && user.trainerProfile) {
          if (user.trainerProfile.role === 'ADMIN') {
            roles.push('ADMIN');
            roles.push('TRAINER'); // Admin can also act as trainer
          } else {
            roles.push('TRAINER');
          }
        }

        if (roles.length === 0) {
          throw new Error('Keine aktiven Rollen gefunden');
        }

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles,
          athleteProfileId: user.athleteProfile?.id,
          trainerProfileId: user.trainerProfile?.id,
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.roles = user.roles;
        token.athleteProfileId = user.athleteProfileId;
        token.trainerProfileId = user.trainerProfileId;

        // Set default active role (highest privilege)
        if (user.roles.includes('ADMIN')) {
          token.activeRole = 'ADMIN';
        } else if (user.roles.includes('TRAINER')) {
          token.activeRole = 'TRAINER';
        } else {
          token.activeRole = 'ATHLETE';
        }
      }

      // Handle role switch
      if (trigger === 'update' && session?.activeRole) {
        if (token.roles.includes(session.activeRole)) {
          token.activeRole = session.activeRole;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email,
        firstName: token.firstName,
        lastName: token.lastName,
        roles: token.roles,
        activeRole: token.activeRole,
        athleteProfileId: token.athleteProfileId,
        trainerProfileId: token.trainerProfileId,
      };
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
};
