import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Cancel a session with mandatory reason
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ATHLETE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const athleteId = session.user.id;
    const body = await request.json();
    const { trainingSessionId, reason } = body;

    // Validate inputs
    if (!trainingSessionId || !reason) {
      return NextResponse.json(
        { error: 'Training session ID and reason are required' },
        { status: 400 }
      );
    }

    // Validate reason length (minimum 10 characters)
    if (reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Reason must be at least 10 characters long' },
        { status: 400 }
      );
    }

    // Check if session exists and is in the future
    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id: trainingSessionId },
    });

    if (!trainingSession) {
      return NextResponse.json(
        { error: 'Training session not found' },
        { status: 404 }
      );
    }

    // Cannot cancel past sessions
    if (new Date(trainingSession.date) < new Date()) {
      return NextResponse.json(
        { error: 'Cannot cancel past training sessions' },
        { status: 400 }
      );
    }

    // Check if already cancelled
    const existingCancellation = await prisma.cancellation.findFirst({
      where: {
        athleteId,
        trainingSessionId,
        isActive: true,
      },
    });

    if (existingCancellation) {
      return NextResponse.json(
        { error: 'Session already cancelled' },
        { status: 400 }
      );
    }

    // Create cancellation
    const cancellation = await prisma.cancellation.create({
      data: {
        athleteId,
        trainingSessionId,
        reason: reason.trim(),
      },
    });

    return NextResponse.json(
      { 
        message: 'Training session cancelled successfully',
        cancellation 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Cancel session API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get athlete's cancellations
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ATHLETE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const athleteId = session.user.id;

    const cancellations = await prisma.cancellation.findMany({
      where: {
        athleteId,
        isActive: true,
      },
      include: {
        trainingSession: {
          select: {
            date: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: { cancelledAt: 'desc' },
    });

    return NextResponse.json({ cancellations });
  } catch (error) {
    console.error('Get cancellations API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}