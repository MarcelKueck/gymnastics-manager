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

    // Get athlete info
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      select: {
        firstName: true,
        lastName: true,
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

    // Get next training session
    const now = new Date();
    const nextSession = await prisma.trainingSession.findFirst({
      where: {
        date: { gte: now },
        OR: athlete.groupAssignments.map((assignment) => ({
          dayOfWeek: assignment.trainingDay,
          hourNumber: assignment.hourNumber,
          groupNumber: assignment.groupNumber,
        })),
      },
      orderBy: { date: 'asc' },
      include: {
        cancellations: {
          where: {
            athleteId,
            isActive: true,
          },
        },
      },
    });

    // Count upcoming sessions (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingSessionsCount = await prisma.trainingSession.count({
      where: {
        date: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
        OR: athlete.groupAssignments.map((assignment) => ({
          dayOfWeek: assignment.trainingDay,
          hourNumber: assignment.hourNumber,
          groupNumber: assignment.groupNumber,
        })),
      },
    });

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

    return NextResponse.json({
      upcomingSessions: upcomingSessionsCount,
      totalPresent: presentSessions,
      totalAbsent: absentSessions,
      unexcusedAbsences: unexcusedAbsences,
      recentSessions: attendanceRecords.map((record) => ({
        date: record.trainingSession.date.toISOString(),
        status: record.status,
      })),
      // Legacy fields for backward compatibility
      athlete: {
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        isApproved: athlete.isApproved,
      },
      nextSession: nextSession
        ? {
            id: nextSession.id,
            date: nextSession.date,
            dayOfWeek: nextSession.dayOfWeek,
            hourNumber: nextSession.hourNumber,
            groupNumber: nextSession.groupNumber,
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