import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ATHLETE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const athleteId = session.user.id;

    // Get athlete with recurring training assignments
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      include: {
        recurringTrainingAssignments: {
          include: {
            recurringTraining: {
              select: {
                id: true,
                isActive: true,
                dayOfWeek: true,
                groupNumber: true,
              },
            },
          },
        },
      },
    });

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    if (!athlete.isApproved) {
      return NextResponse.json({ error: 'Account pending approval' }, { status: 403 });
    }

    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    const includeAll = searchParams.get('includeAll') === 'true';

    const now = new Date();
    
    // Get all recurring training IDs the athlete is assigned to
    const recurringTrainingIds = athlete.recurringTrainingAssignments
      .filter(assignment => assignment.recurringTraining?.isActive)
      .map(assignment => assignment.recurringTraining?.id)
      .filter((id): id is string => id !== undefined);

    if (recurringTrainingIds.length === 0) {
      return NextResponse.json({ sessions: [] });
    }

    const whereCondition = {
      recurringTrainingId: {
        in: recurringTrainingIds,
      },
      isCancelled: false, // Don't show cancelled sessions
      ...(includeAll ? {} : { date: { gte: now } }),
    };

    // Get training sessions
    const sessions = await prisma.trainingSession.findMany({
      where: whereCondition,
      orderBy: { date: 'asc' },
      take: limit,
      include: {
        recurringTraining: {
          select: {
            name: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
          },
        },
        cancellations: {
          where: {
            athleteId,
            isActive: true,
          },
          select: {
            id: true,
            reason: true,
            cancelledAt: true,
          },
        },
      },
    });

    return NextResponse.json({ sessions });
  } catch (error: unknown) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}