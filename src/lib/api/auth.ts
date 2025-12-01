import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '../auth';

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getAuthSession();

  if (!session) {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      ),
    };
  }

  return { session, error: null };
}

export async function requireAthlete() {
  const { session, error } = await requireAuth();

  if (error) return { session: null, error };

  if (session!.user.activeRole !== 'ATHLETE') {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'Athleten-Berechtigung erforderlich' },
        { status: 403 }
      ),
    };
  }

  return { session, error: null };
}

export async function requireTrainer() {
  const { session, error } = await requireAuth();

  if (error) return { session: null, error };

  const role = session!.user.activeRole;
  if (role !== 'TRAINER' && role !== 'ADMIN') {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'Trainer-Berechtigung erforderlich' },
        { status: 403 }
      ),
    };
  }

  return { session, error: null };
}

export async function requireAdmin() {
  const { session, error } = await requireAuth();

  if (error) return { session: null, error };

  if (session!.user.activeRole !== 'ADMIN') {
    return {
      session: null,
      error: NextResponse.json(
        { error: 'Administrator-Berechtigung erforderlich' },
        { status: 403 }
      ),
    };
  }

  return { session, error: null };
}
