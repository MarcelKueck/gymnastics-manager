import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only admins can reject athletes
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { athleteId } = body;

    if (!athleteId) {
      return NextResponse.json(
        { error: 'Athlete ID is required' },
        { status: 400 }
      );
    }

    // Find the athlete
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
    });

    if (!athlete) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      );
    }

    if (athlete.isApproved) {
      return NextResponse.json(
        { error: 'Cannot reject an already approved athlete' },
        { status: 400 }
      );
    }

    // Delete the athlete registration
    await prisma.athlete.delete({
      where: { id: athleteId },
    });

    // TODO: Send email notification to athlete about rejection

    return NextResponse.json({
      message: 'Athlete registration rejected',
    });
  } catch (error) {
    console.error('Reject athlete error:', error);
    return NextResponse.json(
      { error: 'Failed to reject athlete' },
      { status: 500 }
    );
  }
}
