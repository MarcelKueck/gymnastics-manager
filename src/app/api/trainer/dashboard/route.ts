import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total active athletes
    const totalAthletes = await prisma.athlete.count({
      where: { isApproved: true },
    });

    // Get pending approvals
    const pendingApprovals = await prisma.athlete.count({
      where: { isApproved: false },
    });

    // Get today's sessions
    const today = new Date();
    const todaySessions = await prisma.trainingSession.count({
      where: {
        date: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      },
    });

    // Get athletes with 3+ unexcused absences (alert count)
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

    return NextResponse.json({
      totalAthletes,
      pendingApprovals,
      todaySessions,
      alertCount,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}