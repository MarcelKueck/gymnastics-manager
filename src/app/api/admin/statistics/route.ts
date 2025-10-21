import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get admin statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get date ranges
    const now = new Date();
    const currentYear = now.getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sunday
    weekEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // System overview statistics
    const [
      totalAthletes,
      approvedAthletes,
      pendingApprovals,
      totalTrainers,
      activeTrainers,
      totalRecurringTrainings,
      totalUploads,
      activeUploads,
    ] = await Promise.all([
      prisma.athlete.count(),
      prisma.athlete.count({ where: { isApproved: true } }),
      prisma.athlete.count({ where: { isApproved: false } }),
      prisma.trainer.count(),
      prisma.trainer.count({ where: { isActive: true } }),
      prisma.recurringTraining.count({ where: { isActive: true } }),
      prisma.upload.count(),
      prisma.upload.count({ where: { isActive: true } }),
    ]);

    // Sessions statistics
    const [
      sessionsThisWeek,
      sessionsThisMonth,
      sessionsThisYear,
      completedSessions,
      cancelledSessions,
    ] = await Promise.all([
      prisma.trainingSession.count({
        where: {
          date: { gte: weekStart, lte: weekEnd },
          isCancelled: false,
        },
      }),
      prisma.trainingSession.count({
        where: {
          date: { gte: monthStart, lte: monthEnd },
          isCancelled: false,
        },
      }),
      prisma.trainingSession.count({
        where: {
          date: { gte: yearStart, lte: yearEnd },
          isCancelled: false,
        },
      }),
      prisma.trainingSession.count({
        where: {
          date: { gte: yearStart, lte: yearEnd },
          isCompleted: true,
          isCancelled: false,
        },
      }),
      prisma.trainingSession.count({
        where: {
          date: { gte: yearStart, lte: yearEnd },
          isCancelled: true,
        },
      }),
    ]);

    // Attendance statistics for current year
    const [
      totalAttendanceRecords,
      presentRecords,
      absentExcusedRecords,
      absentUnexcusedRecords,
    ] = await Promise.all([
      prisma.attendanceRecord.count({
        where: { markedAt: { gte: yearStart, lte: yearEnd } },
      }),
      prisma.attendanceRecord.count({
        where: {
          markedAt: { gte: yearStart, lte: yearEnd },
          status: 'PRESENT',
        },
      }),
      prisma.attendanceRecord.count({
        where: {
          markedAt: { gte: yearStart, lte: yearEnd },
          status: 'ABSENT_EXCUSED',
        },
      }),
      prisma.attendanceRecord.count({
        where: {
          markedAt: { gte: yearStart, lte: yearEnd },
          status: 'ABSENT_UNEXCUSED',
        },
      }),
    ]);

    const attendanceRate = totalAttendanceRecords > 0
      ? Math.round((presentRecords / totalAttendanceRecords) * 100)
      : 0;

    // Get uploads by category
    const uploadsByCategory = await prisma.uploadCategory.findMany({
      where: { isActive: true },
      select: {
        name: true,
        _count: {
          select: {
            uploads: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const uploadsByCategoryFormatted = uploadsByCategory.map((cat) => ({
      category: cat.name,
      count: cat._count.uploads,
    }));

    // Get top performing athletes (top 10 by attendance rate)
    const allAthletes = await prisma.athlete.findMany({
      where: { isApproved: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    const athletesWithAttendance = await Promise.all(
      allAthletes.map(async (athlete) => {
        const [sessionsAttended, totalSessions] = await Promise.all([
          prisma.attendanceRecord.count({
            where: {
              athleteId: athlete.id,
              status: 'PRESENT',
              markedAt: { gte: yearStart, lte: yearEnd },
            },
          }),
          prisma.attendanceRecord.count({
            where: {
              athleteId: athlete.id,
              markedAt: { gte: yearStart, lte: yearEnd },
            },
          }),
        ]);

        const attendanceRate = totalSessions > 0
          ? Math.round((sessionsAttended / totalSessions) * 100)
          : 0;

        return {
          id: athlete.id,
          name: `${athlete.firstName} ${athlete.lastName}`,
          attendanceRate,
          sessionsAttended,
          totalSessions,
        };
      })
    );

    // Filter athletes with at least 5 sessions and sort by attendance rate
    const topPerformingAthletes = athletesWithAttendance
      .filter((a) => a.totalSessions >= 5)
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
      .slice(0, 10);

    // Get recent audit logs
    const recentActivity = await prisma.auditLog.findMany({
      take: 15,
      orderBy: { performedAt: 'desc' },
      select: {
        id: true,
        entityType: true,
        action: true,
        performedAt: true,
        performedByUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const recentActivityFormatted = recentActivity.map((activity) => ({
      id: activity.id,
      entityType: activity.entityType,
      action: activity.action,
      performedAt: activity.performedAt,
      performedBy: `${activity.performedByUser.firstName} ${activity.performedByUser.lastName}`,
    }));

    return NextResponse.json({
      system: {
        totalAthletes,
        approvedAthletes,
        pendingApprovals,
        totalTrainers,
        activeTrainers,
        totalRecurringTrainings,
        totalUploads,
        activeUploads,
      },
      sessions: {
        thisWeek: sessionsThisWeek,
        thisMonth: sessionsThisMonth,
        thisYear: sessionsThisYear,
        completed: completedSessions,
        cancelled: cancelledSessions,
      },
      attendance: {
        thisYearTotal: totalAttendanceRecords,
        present: presentRecords,
        absentExcused: absentExcusedRecords,
        absentUnexcused: absentUnexcusedRecords,
        attendanceRate,
      },
      uploadsByCategory: uploadsByCategoryFormatted,
      topPerformingAthletes,
      recentActivity: recentActivityFormatted,
    });
  } catch (error) {
    console.error('Get admin statistics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
