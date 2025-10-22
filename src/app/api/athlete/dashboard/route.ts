import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ATHLETE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const athleteId = session.user.id;

    // Get athlete info with recurring training group assignments
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: {
        firstName: true,
        lastName: true,
        isApproved: true,
        recurringTrainingAssignments: {
          include: {
            trainingGroup: {
              include: {
                recurringTraining: {
                  select: {
                    id: true,
                    dayOfWeek: true,
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    // If not approved, return limited data
    if (!athlete.isApproved) {
      return NextResponse.json({
        upcomingSessions: 0,
        totalPresent: 0,
        totalAbsent: 0,
        unexcusedAbsences: 0,
        recentSessions: [],
        athlete: {
          firstName: athlete.firstName,
          lastName: athlete.lastName,
          isApproved: false,
        },
        nextSession: null,
        attendancePercentage: 0,
      });
    }

    // Get recurring training IDs the athlete is assigned to
    const now = new Date();
    const recurringTrainingIds = athlete.recurringTrainingAssignments
      .filter(assignment => assignment.trainingGroup.recurringTraining?.isActive)
      .map(assignment => assignment.trainingGroup.recurringTraining.id);

    // Get next training session
    const nextSession = recurringTrainingIds.length > 0 
      ? await prisma.trainingSession.findFirst({
          where: {
            date: { gte: now },
            recurringTrainingId: {
              in: recurringTrainingIds,
            },
            isCancelled: false,
          },
          orderBy: { date: 'asc' },
          include: {
            recurringTraining: {
              select: {
                name: true,
                dayOfWeek: true,
                startTime: true,
                endTime: true,
              },
            },
            groups: {
              include: {
                trainingGroup: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            cancellations: {
              where: {
                athleteId,
                isActive: true,
              },
            },
          },
        })
      : null;

    // Count upcoming sessions (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingSessionsCount = recurringTrainingIds.length > 0
      ? await prisma.trainingSession.count({
          where: {
            date: {
              gte: now,
              lte: thirtyDaysFromNow,
            },
            recurringTrainingId: {
              in: recurringTrainingIds,
            },
            isCancelled: false,
          },
        })
      : 0;

    // Calculate attendance percentage (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        athleteId,
        trainingSession: {
          date: {
            gte: threeMonthsAgo,
            lte: now,
          },
        },
      },
      include: {
        trainingSession: true,
      },
      orderBy: {
        trainingSession: {
          date: 'desc',
        },
      },
      take: 10,
    });

    const totalSessions = attendanceRecords.length;
    const presentSessions = attendanceRecords.filter(
      (record) => record.status === 'PRESENT'
    ).length;
    const absentSessions = attendanceRecords.filter(
      (record) => record.status === 'ABSENT_EXCUSED' || record.status === 'ABSENT_UNEXCUSED'
    ).length;
    const unexcusedAbsences = attendanceRecords.filter(
      (record) => record.status === 'ABSENT_UNEXCUSED'
    ).length;

    const attendancePercentage =
      totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

    // Find athlete's group for the next session
    const athleteGroupForNextSession = nextSession
      ? athlete.recurringTrainingAssignments.find(
          assignment => assignment.trainingGroup.recurringTraining.id === nextSession.recurringTrainingId
        )
      : null;

    return NextResponse.json({
      upcomingSessions: upcomingSessionsCount,
      totalPresent: presentSessions,
      totalAbsent: absentSessions,
      unexcusedAbsences: unexcusedAbsences,
      recentSessions: attendanceRecords.map((record) => ({
        date: record.trainingSession.date.toISOString(),
        status: record.status,
      })),
      athlete: {
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        isApproved: athlete.isApproved,
      },
      nextSession: nextSession
        ? {
            id: nextSession.id,
            date: nextSession.date,
            trainingName: nextSession.recurringTraining?.name,
            dayOfWeek: nextSession.dayOfWeek,
            startTime: nextSession.startTime,
            endTime: nextSession.endTime,
            groupName: athleteGroupForNextSession?.trainingGroup.name || null,
            isCancelled: nextSession.cancellations.length > 0,
          }
        : null,
      attendancePercentage,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}