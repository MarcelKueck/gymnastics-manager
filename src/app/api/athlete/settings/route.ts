import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get athlete settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ATHLETE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const athlete = await prisma.athlete.findUnique({
      where: { id: session.user.id },
      select: {
        autoConfirmFutureSessions: true,
      },
    });

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    return NextResponse.json(athlete);
  } catch (error) {
    console.error('Get settings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update athlete settings
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ATHLETE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { autoConfirmFutureSessions } = body;

    if (typeof autoConfirmFutureSessions !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid autoConfirmFutureSessions value' },
        { status: 400 }
      );
    }

    const athlete = await prisma.athlete.update({
      where: { id: session.user.id },
      data: { autoConfirmFutureSessions },
      select: {
        autoConfirmFutureSessions: true,
      },
    });

    return NextResponse.json({ 
      message: 'Settings updated successfully',
      athlete 
    });
  } catch (error) {
    console.error('Update settings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}