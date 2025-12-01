import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: 'Nicht authentifiziert' },
      { status: 401 }
    );
  }

  const { role } = await request.json();

  // Validate role is available to user
  if (!session.user.roles.includes(role)) {
    return NextResponse.json(
      { error: 'Diese Rolle ist nicht verfügbar' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
    activeRole: role,
    message: 'Rolle erfolgreich gewechselt',
  });
}
