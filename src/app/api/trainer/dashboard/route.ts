import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    if (session.user.activeRole !== 'TRAINER' && session.user.activeRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    // Get current week boundaries
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    endOfWeek.setHours(23, 59, 59, 999);

    // Get upcoming sessions for this week and next
    const endOfNextWeek = new Date(endOfWeek);
    endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);

    const upcomingSessions = await prisma.trainingSession.findMany({
      where: {
        date: {
          gte: now,
          lte: endOfNextWeek,
        },
        isCancelled: false,
      },
      include: {
        recurringTraining: {
          include: {
            trainingGroups: true,
          },
        },
        attendanceRecords: true,
      },
      orderBy: {
        date: 'asc',
      },
      take: 10,
    });

    // Get pending athlete approvals count
    const pendingApprovals = await prisma.athleteProfile.count({
      where: {
        status: 'PENDING',
      },
    });

    // Get athletes with high absence counts (3+ in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const absenceAlerts = await prisma.absenceAlert.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
        acknowledged: false,
      },
      include: {
        athlete: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // Stats for this week
    const sessionsThisWeek = await prisma.trainingSession.count({
      where: {
        date: {
          gte: startOfWeek,
          lte: now,
        },
        isCancelled: false,
      },
    });

    const attendanceMarkedThisWeek = await prisma.trainingSession.count({
      where: {
        date: {
          gte: startOfWeek,
          lte: now,
        },
        isCancelled: false,
        attendanceRecords: {
          some: {},
        },
      },
    });

    const data = {
      upcomingSessions: upcomingSessions.map((session) => ({
        id: session.id,
        date: session.date.toISOString(),
        name: session.recurringTraining?.name || 'Training',
        startTime: session.recurringTraining?.startTime || '',
        endTime: session.recurringTraining?.endTime || '',
        groups: session.recurringTraining?.trainingGroups.map((g) => g.name) || [],
        attendanceMarked: session.attendanceRecords.length > 0,
      })),
      pendingApprovals,
      athletesNeedingAttention: absenceAlerts.map((alert) => ({
        id: alert.athlete.id,
        name: `${alert.athlete.user.firstName} ${alert.athlete.user.lastName}`,
        absenceCount: alert.absenceCount,
        alertDate: alert.createdAt.toISOString(),
      })),
      stats: {
        sessionsThisWeek,
        attendanceMarkedThisWeek,
      },
    };

    return NextResponse.json({ data }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Dashboard-Daten' },
      { status: 500 }
    );
  }
}
