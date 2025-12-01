import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateVirtualSessions, getVirtualSessionId } from '@/lib/sessions/virtual-sessions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    if (session.user.activeRole !== 'TRAINER' && session.user.activeRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Default to current week if no dates provided
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    defaultStart.setHours(0, 0, 0, 0);
    
    const defaultEnd = new Date(defaultStart);
    defaultEnd.setDate(defaultStart.getDate() + 6); // Sunday
    defaultEnd.setHours(23, 59, 59, 999);

    const startDate = startDateParam ? new Date(startDateParam) : defaultStart;
    const endDate = endDateParam ? new Date(endDateParam) : defaultEnd;

    // Fetch recurring trainings with their groups
    const recurringTrainings = await prisma.recurringTraining.findMany({
      where: { isActive: true },
      include: {
        trainingGroups: {
          include: {
            _count: {
              select: { athleteAssignments: true },
            },
          },
        },
      },
    });

    // Fetch any stored sessions in this date range (sessions with modifications)
    const storedSessions = await prisma.trainingSession.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        _count: {
          select: { attendanceRecords: true },
        },
      },
    });

    // Generate virtual sessions
    const virtualSessions = generateVirtualSessions(
      recurringTrainings,
      storedSessions,
      startDate,
      endDate
    );

    // Transform to API response format
    const data = virtualSessions.map((vs) => {
      const expectedAthletes = vs.groups.reduce((sum, g) => sum + g.athleteCount, 0);
      
      return {
        // Use stored ID if exists, otherwise generate virtual ID
        id: vs.id || getVirtualSessionId(vs.recurringTrainingId, vs.date),
        recurringTrainingId: vs.recurringTrainingId,
        date: vs.date.toISOString(),
        name: vs.trainingName,
        startTime: vs.startTime,
        endTime: vs.endTime,
        groups: vs.groups.map(g => g.name),
        attendanceMarked: vs.hasAttendance,
        isCancelled: vs.isCancelled,
        expectedAthletes,
        presentCount: 0, // Will be filled from stored session if exists
        isVirtual: vs.id === null, // Flag to indicate if this is a calculated session
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Sessions API error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Trainingseinheiten' },
      { status: 500 }
    );
  }
}
