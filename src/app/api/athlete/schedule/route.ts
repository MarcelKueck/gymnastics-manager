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

    // Get athlete with group assignments
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: {
        isApproved: true,
        groupAssignments: {
          where: { isActive: true },
          select: {
            trainingDay: true,
            hourNumber: true,
            groupNumber: true,
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const includeAll = searchParams.get('includeAll') === 'true';

    const now = new Date();
    const whereCondition: any = {
      OR: athlete.groupAssignments.map((assignment) => ({
        dayOfWeek: assignment.trainingDay,
        hourNumber: assignment.hourNumber,
        groupNumber: assignment.groupNumber,
      })),
    };

    // If not including all, only show future sessions
    if (!includeAll) {
      whereCondition.date = { gte: now };
    }

    // Get training sessions
    const sessions = await prisma.trainingSession.findMany({
      where: whereCondition,
      orderBy: { date: 'asc' },
      take: limit,
      include: {
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
  } catch (error) {
    console.error('Schedule API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}