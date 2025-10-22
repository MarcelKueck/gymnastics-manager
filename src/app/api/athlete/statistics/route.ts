import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get athlete statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ATHLETE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current year date range
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

    // Current year statistics
    const [sessionsAttended, cancellations, totalSessions] = await Promise.all([
      prisma.attendanceRecord.count({
        where: {
          athleteId: session.user.id,
          status: 'PRESENT',
          markedAt: { gte: yearStart, lte: yearEnd },
        },
      }),
      prisma.cancellation.count({
        where: {
          athleteId: session.user.id,
          isActive: true,
          cancelledAt: { gte: yearStart, lte: yearEnd },
        },
      }),
      prisma.attendanceRecord.count({
        where: {
          athleteId: session.user.id,
          markedAt: { gte: yearStart, lte: yearEnd },
        },
      }),
    ]);

    // Calculate attendance rate
    const attendanceRate = totalSessions > 0 
      ? Math.round((sessionsAttended / totalSessions) * 100)
      : 0;

    // All time statistics
    const [allTimeSessions, allTimeCancellations] = await Promise.all([
      prisma.attendanceRecord.count({
        where: {
          athleteId: session.user.id,
          status: 'PRESENT',
        },
      }),
      prisma.cancellation.count({
        where: {
          athleteId: session.user.id,
          isActive: true,
        },
      }),
    ]);

    // Get athlete with their training group assignments
    const athlete = await prisma.athlete.findUnique({
      where: { id: session.user.id },
      include: {
        recurringTrainingAssignments: {
          include: {
            trainingGroup: {
              include: {
                recurringTraining: {
                  select: {
                    id: true,
                    name: true,
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

    // Get recurring training IDs the athlete is assigned to
    const recurringTrainingIds = athlete.recurringTrainingAssignments
      .map(assignment => assignment.trainingGroup.recurringTraining.id);

    // Create a map of recurringTrainingId -> groupName
    const groupMap = new Map(
      athlete.recurringTrainingAssignments.map((assignment) => [
        assignment.trainingGroup.recurringTraining.id,
        {
          groupName: assignment.trainingGroup.name,
          trainingName: assignment.trainingGroup.recurringTraining.name,
        },
      ])
    );

    // Get next upcoming session
    const nextSession = recurringTrainingIds.length > 0
      ? await prisma.trainingSession.findFirst({
          where: {
            date: { gte: new Date() },
            isCancelled: false,
            recurringTrainingId: {
              in: recurringTrainingIds,
            },
          },
          orderBy: { date: 'asc' },
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            dayOfWeek: true,
            recurringTrainingId: true,
            recurringTraining: {
              select: {
                name: true,
              },
            },
          },
        })
      : null;

    // Format next session with group info
    const nextSessionFormatted = nextSession
      ? {
          ...nextSession,
          groupName: nextSession.recurringTrainingId
            ? groupMap.get(nextSession.recurringTrainingId)?.groupName || null
            : null,
          trainingName: nextSession.recurringTraining?.name || null,
        }
      : null;

    // Get total active uploads count
    const uploadsCount = await prisma.upload.count({
      where: { isActive: true },
    });

    // Get recent attendance records (last 10)
    const recentAttendance = await prisma.attendanceRecord.findMany({
      where: { athleteId: session.user.id },
      orderBy: { markedAt: 'desc' },
      take: 10,
      select: {
        status: true,
        markedAt: true,
        trainingSession: {
          select: {
            date: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            recurringTrainingId: true,
            recurringTraining: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const recentAttendanceFormatted = recentAttendance.map((record) => {
      const groupInfo = record.trainingSession.recurringTrainingId
        ? groupMap.get(record.trainingSession.recurringTrainingId)
        : null;
      
      return {
        date: record.trainingSession.date,
        status: record.status,
        sessionInfo: `${record.trainingSession.recurringTraining?.name || record.trainingSession.dayOfWeek} - ${groupInfo?.groupName || 'N/A'} (${record.trainingSession.startTime} - ${record.trainingSession.endTime})`,
      };
    });

    return NextResponse.json({
      currentYear: {
        sessionsAttended,
        cancellations,
        attendanceRate,
        totalSessions,
      },
      allTime: {
        totalSessions: allTimeSessions,
        totalCancellations: allTimeCancellations,
      },
      nextSession: nextSessionFormatted,
      uploadsCount,
      recentAttendance: recentAttendanceFormatted,
    });
  } catch (error) {
    console.error('Get athlete statistics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
