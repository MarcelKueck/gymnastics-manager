import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetRole } = body as { targetRole: UserRole };

    if (!targetRole) {
      return NextResponse.json({ error: 'Target role is required' }, { status: 400 });
    }

    // Validate that user has access to the target role
    if (!session.user.roles.includes(targetRole)) {
      return NextResponse.json(
        { error: 'You do not have access to this role' },
        { status: 403 }
      );
    }

    // The role switch will be handled by updating the session
    // This is done through NextAuth's update() function on the client side
    return NextResponse.json({
      success: true,
      activeRole: targetRole,
    });
  } catch (error) {
    console.error('Error switching role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
