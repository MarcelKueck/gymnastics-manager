import { NextResponse } from 'next/server';
import { requireAthlete } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth } from 'date-fns';

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
      select: { trainingGroupId: true },
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

    // Upcoming sessions for the athlete's groups
    const upcomingSessions = await prisma.trainingSession.findMany({
      where: {
        date: { gte: now },
        isCancelled: false,
        recurringTraining: {
          trainingGroups: {
            some: { id: { in: groupIds } },
          },
        },
      },
      include: {
        recurringTraining: true,
        cancellations: {
          where: { athleteId, isActive: true },
        },
      },
      orderBy: { date: 'asc' },
      take: 5,
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
        upcomingSessions: upcomingSessions.map((s) => ({
          id: s.id,
          date: s.date.toISOString(),
          name: s.recurringTraining?.name || 'Training',
          startTime: s.startTime || s.recurringTraining?.startTime || '00:00',
          endTime: s.endTime || s.recurringTraining?.endTime || '00:00',
          isCancelled: s.cancellations.length > 0,
        })),
        monthlyStats: {
          totalSessions,
          presentCount,
          attendanceRate,
        },
        activeCancellations,
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
