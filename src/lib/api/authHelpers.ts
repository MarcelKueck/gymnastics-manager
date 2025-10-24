import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { unauthorizedResponse, forbiddenResponse } from './responseHelpers';
import { NextResponse } from 'next/server';

/**
 * Get authenticated user session
 */
export async function getAuthSession() {
  const session = await getServerSession(authOptions);
  return session;
}

/**
 * Require authentication
 */
export async function requireAuth() {
  const session = await getAuthSession();

  if (!session || !session.user) {
    throw new Error('Authentifizierung erforderlich');
  }

  return session;
}

/**
 * Require specific role
 */
export async function requireRole(roles: UserRole | UserRole[]) {
  const session = await requireAuth();
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (!allowedRoles.includes(session.user.role)) {
    throw new Error('Unzureichende Berechtigungen');
  }

  return session;
}

/**
 * Require athlete role
 */
export async function requireAthlete() {
  return requireRole(UserRole.ATHLETE);
}

/**
 * Require trainer role
 */
export async function requireTrainer() {
  return requireRole([UserRole.TRAINER, UserRole.ADMIN]);
}

/**
 * Require admin role
 */
export async function requireAdmin() {
  return requireRole(UserRole.ADMIN);
}

/**
 * Check if user is admin
 */
export async function isAdmin() {
  try {
    const session = await getAuthSession();
    return session?.user?.role === UserRole.ADMIN;
  } catch {
    return false;
  }
}

/**
 * Check if user is trainer or admin
 */
export async function isTrainerOrAdmin() {
  try {
    const session = await getAuthSession();
    return (
      session?.user?.role === UserRole.TRAINER ||
      session?.user?.role === UserRole.ADMIN
    );
  } catch {
    return false;
  }
}

/**
 * Verify user owns resource (for athletes)
 */
export async function verifyOwnership(resourceOwnerId: string) {
  const session = await requireAuth();

  // Admins and trainers can access any resource
  if (
    session.user.role === UserRole.ADMIN ||
    session.user.role === UserRole.TRAINER
  ) {
    return session;
  }

  // Athletes can only access their own resources
  if (session.user.id !== resourceOwnerId) {
    throw new Error('Zugriff verweigert');
  }

  return session;
}

/**
 * Auth middleware wrapper for API routes
 */
export function withAuth(
  handler: (req: Request, session: any, context?: any) => Promise<NextResponse>,
  options?: {
    requireRole?: UserRole | UserRole[];
  }
) {
  return async (req: Request, context?: any) => {
    try {
      let session;

      if (options?.requireRole) {
        session = await requireRole(options.requireRole);
      } else {
        session = await requireAuth();
      }

      return await handler(req, session, context);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Authentifizierung erforderlich') {
          return unauthorizedResponse();
        }
        if (error.message === 'Unzureichende Berechtigungen' || error.message === 'Zugriff verweigert') {
          return forbiddenResponse();
        }
      }
      throw error;
    }
  };
}