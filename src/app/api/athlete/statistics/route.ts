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

    // Get next upcoming session
    const nextSession = await prisma.trainingSession.findFirst({
      where: {
        date: { gte: new Date() },
        isCancelled: false,
        recurringTraining: {
          athleteAssignments: {
            some: { athleteId: session.user.id },
          },
        },
      },
      orderBy: { date: 'asc' },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        dayOfWeek: true,
        groupNumber: true,
      },
    });

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
            groupNumber: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    const recentAttendanceFormatted = recentAttendance.map((record) => ({
      date: record.trainingSession.date,
      status: record.status,
      sessionInfo: `${record.trainingSession.dayOfWeek} - Gruppe ${record.trainingSession.groupNumber} (${record.trainingSession.startTime} - ${record.trainingSession.endTime})`,
    }));

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
      nextSession,
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
