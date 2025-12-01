import { NextResponse } from 'next/server';
import { requireAthlete } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, addDays } from 'date-fns';
import { generateVirtualSessions, getVirtualSessionId } from '@/lib/sessions/virtual-sessions';

export async function GET() {
  const { session, error } = await requireAthlete();
  if (error) return error;

  const athleteId = session!.user.athleteProfileId!;
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  try {
    // Get athlete's training group IDs via their assignments
    const assignments = await prisma.recurringTrainingAthleteAssignment.findMany({
      where: { athleteId },
      include: {
        trainingGroup: {
          include: { recurringTraining: true },
        },
      },
    });
    const groupIds = assignments.map((a) => a.trainingGroupId);

    // If athlete isn't assigned to any groups, return empty data
    if (groupIds.length === 0) {
      return NextResponse.json({
        data: {
          upcomingSessions: [],
          monthlyStats: {
            totalSessions: 0,
            presentCount: 0,
            attendanceRate: 0,
          },
          activeCancellations: 0,
        },
      });
    }

    // Get recurring training IDs for this athlete
    const recurringTrainingIds = Array.from(new Set(
      assignments.map((a) => a.trainingGroup.recurringTrainingId)
    ));

    // Get recurring trainings for the athlete's groups
    const recurringTrainings = await prisma.recurringTraining.findMany({
      where: {
        id: { in: recurringTrainingIds },
        isActive: true,
      },
      include: {
        trainingGroups: {
          where: { id: { in: groupIds } },
          include: {
            _count: {
              select: { athleteAssignments: true },
            },
          },
        },
      },
    });

    // Generate virtual sessions for the next 14 days
    const endDate = addDays(now, 14);

    // Fetch stored sessions in date range
    const storedSessions = await prisma.trainingSession.findMany({
      where: {
        date: { gte: now, lte: endDate },
        recurringTrainingId: { in: recurringTrainingIds },
      },
      include: {
        _count: {
          select: { attendanceRecords: true },
        },
        cancellations: {
          where: { athleteId, isActive: true },
        },
      },
    });

    // Generate virtual sessions
    const virtualSessions = generateVirtualSessions(
      recurringTrainings,
      storedSessions,
      now,
      endDate
    );

    // Create a map to check for athlete cancellations
    const storedSessionsByKey = new Map(
      storedSessions.map((s) => [
        `${s.recurringTrainingId}_${s.date.toISOString().split('T')[0]}`,
        s,
      ])
    );

    // Filter out cancelled sessions and map to response format
    const upcomingSessions = virtualSessions
      .filter((s) => !s.isCancelled)
      .slice(0, 5)
      .map((s) => {
        const dateKey = `${s.recurringTrainingId}_${s.date.toISOString().split('T')[0]}`;
        const stored = storedSessionsByKey.get(dateKey);
        const hasCancellation = stored?.cancellations && stored.cancellations.length > 0;

        return {
          id: s.id || getVirtualSessionId(s.recurringTrainingId, s.date),
          date: s.date.toISOString(),
          name: s.trainingName || 'Training',
          startTime: s.startTime,
          endTime: s.endTime,
          isCancelled: hasCancellation || false,
        };
      });

    // Monthly attendance stats
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        athleteId,
        trainingSession: {
          date: { gte: monthStart, lte: monthEnd },
        },
      },
    });

    const totalSessions = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(
      (r) => r.status === 'PRESENT'
    ).length;
    const attendanceRate = totalSessions > 0 
      ? Math.round((presentCount / totalSessions) * 100) 
      : 0;

    // Active cancellations count
    const activeCancellations = await prisma.cancellation.count({
      where: {
        athleteId,
        isActive: true,
        trainingSession: { date: { gte: now } },
      },
    });

    return NextResponse.json({
      data: {
        upcomingSessions,
        monthlyStats: {
          totalSessions,
          presentCount,
          attendanceRate,
        },
        activeCancellations,
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    console.error('Dashboard API error:', err);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Dashboard-Daten' },
      { status: 500 }
    );
  }
}
