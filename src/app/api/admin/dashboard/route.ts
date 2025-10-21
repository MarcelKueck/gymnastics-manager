import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subDays } from 'date-fns';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
    const last7Days = subDays(today, 7);

    // Get total active athletes
    const totalAthletes = await prisma.athlete.count({
      where: { isApproved: true },
    });

    // Get pending approvals
    const pendingApprovals = await prisma.athlete.count({
      where: { isApproved: false },
    });

    // Get total trainers
    const totalTrainers = await prisma.trainer.count({
      where: { isActive: true },
    });

    // Get today's sessions
    const todaySessions = await prisma.trainingSession.count({
      where: {
        date: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
        isCancelled: false,
      },
    });

    // Get this week's sessions
    const weekSessions = await prisma.trainingSession.count({
      where: {
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
        isCancelled: false,
      },
    });

    // Get total active recurring trainings
    const activeRecurringTrainings = await prisma.recurringTraining.count({
      where: { isActive: true },
    });

    // Get athletes with 3+ unexcused absences
    const athletesWithAlerts = await prisma.athlete.findMany({
      where: {
        isApproved: true,
        attendanceRecords: {
          some: {
            status: 'ABSENT_UNEXCUSED',
          },
        },
      },
      select: {
        id: true,
        attendanceRecords: {
          where: {
            status: 'ABSENT_UNEXCUSED',
          },
          select: {
            id: true,
          },
        },
      },
    });

    const alertCount = athletesWithAlerts.filter(
      (athlete) => athlete.attendanceRecords.length >= 3
    ).length;

    // Get recent registrations (last 7 days)
    const recentRegistrations = await prisma.athlete.count({
      where: {
        createdAt: {
          gte: last7Days,
        },
      },
    });

    // Get cancelled sessions this week
    const cancelledSessionsThisWeek = await prisma.trainingSession.count({
      where: {
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
        isCancelled: true,
      },
    });

    // Get attendance stats for today (if sessions exist)
    const todayAttendance = await prisma.attendanceRecord.count({
      where: {
        trainingSession: {
          date: {
            gte: startOfDay(today),
            lte: endOfDay(today),
          },
        },
      },
    });

    // Get total uploaded files
    const totalUploads = await prisma.upload.count({
      where: { isActive: true },
    });

    // Get recent activity (last 5 athletes approved)
    const recentApprovals = await prisma.athlete.findMany({
      where: {
        isApproved: true,
        approvedAt: {
          not: null,
        },
      },
      orderBy: {
        approvedAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        approvedAt: true,
        approvedByTrainer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      // Core stats
      totalAthletes,
      pendingApprovals,
      totalTrainers,
      todaySessions,
      weekSessions,
      activeRecurringTrainings,
      alertCount,
      
      // Additional metrics
      recentRegistrations,
      cancelledSessionsThisWeek,
      todayAttendance,
      totalUploads,
      
      // Recent activity
      recentApprovals: recentApprovals.map((athlete) => ({
        id: athlete.id,
        name: `${athlete.firstName} ${athlete.lastName}`,
        approvedAt: athlete.approvedAt,
        approvedBy: athlete.approvedByTrainer
          ? `${athlete.approvedByTrainer.firstName} ${athlete.approvedByTrainer.lastName}`
          : 'Unknown',
      })),
    });
  } catch (error) {
    console.error('Admin dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
