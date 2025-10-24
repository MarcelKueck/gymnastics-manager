import { UserRole } from '@prisma/client';
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    roles: UserRole[];      // Array of all available roles
    activeRole: UserRole;    // Currently active role
    isAthlete: boolean;      // Quick check flags
    isTrainer: boolean;
    isAdmin: boolean;
    athleteProfileId?: string;  // ID of athlete profile if exists
    trainerProfileId?: string;  // ID of trainer profile if exists
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      roles: UserRole[];
      activeRole: UserRole;
      isAthlete: boolean;
      isTrainer: boolean;
      isAdmin: boolean;
      athleteProfileId?: string;
      trainerProfileId?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    roles: UserRole[];
    activeRole: UserRole;
    isAthlete: boolean;
    isTrainer: boolean;
    isAdmin: boolean;
    athleteProfileId?: string;
    trainerProfileId?: string;
  }
}