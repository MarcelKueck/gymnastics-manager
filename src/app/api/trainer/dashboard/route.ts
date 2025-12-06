import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateVirtualSessions, getVirtualSessionId } from '@/lib/sessions/virtual-sessions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    if (session.user.activeRole !== 'TRAINER' && session.user.activeRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    const isAdmin = session.user.activeRole === 'ADMIN';
    const trainerProfileId = session.user.trainerProfileId;

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

    // For non-admin trainers, get only their assigned training groups
    let trainingGroupIds: string[] | null = null;
    let recurringTrainingIds: string[] | null = null;

    if (!isAdmin && trainerProfileId) {
      const trainerAssignments = await prisma.recurringTrainingTrainerAssignment.findMany({
        where: { trainerId: trainerProfileId },
        include: {
          trainingGroup: {
            include: { recurringTraining: true },
          },
        },
      });

      trainingGroupIds = trainerAssignments.map((a) => a.trainingGroupId);
      recurringTrainingIds = Array.from(new Set(
        trainerAssignments.map((a) => a.trainingGroup.recurringTrainingId)
      ));

      // If trainer has no assignments, return empty dashboard data
      if (trainingGroupIds.length === 0) {
        return NextResponse.json({
          data: {
            upcomingSessions: [],
            pendingApprovals: 0,
            athletesNeedingAttention: [],
            stats: {
              sessionsThisWeek: 0,
              attendanceMarkedThisWeek: 0,
            },
          },
        });
      }
    }

    // Get recurring trainings with their groups (filtered for non-admin trainers)
    const recurringTrainings = await prisma.recurringTraining.findMany({
      where: {
        isActive: true,
        ...(recurringTrainingIds ? { id: { in: recurringTrainingIds } } : {}),
      },
      include: {
        trainingGroups: {
          ...(trainingGroupIds ? { where: { id: { in: trainingGroupIds } } } : {}),
          include: {
            _count: {
              select: { athleteAssignments: true },
            },
          },
        },
      },
    });

    // Fetch stored sessions for date range (filtered for non-admin trainers)
    const storedSessions = await prisma.trainingSession.findMany({
      where: {
        date: {
          gte: startOfWeek,
          lte: endOfNextWeek,
        },
        ...(recurringTrainingIds ? { recurringTrainingId: { in: recurringTrainingIds } } : {}),
      },
      include: {
        _count: {
          select: { attendanceRecords: true },
        },
      },
    });

    // Create map for easy lookup
    const storedSessionsByKey = new Map(
      storedSessions.map((s) => [
        `${s.recurringTrainingId}_${s.date.toISOString().split('T')[0]}`,
        s,
      ])
    );

    // Generate virtual sessions for upcoming
    const virtualSessions = generateVirtualSessions(
      recurringTrainings,
      storedSessions.filter((s) => s.date >= now),
      now,
      endOfNextWeek
    );

    // Map virtual sessions to response format
    const upcomingSessions = virtualSessions
      .filter((s) => !s.isCancelled)
      .slice(0, 10)
      .map((s) => {
        const dateKey = `${s.recurringTrainingId}_${s.date.toISOString().split('T')[0]}`;
        const stored = storedSessionsByKey.get(dateKey);
        
        return {
          id: s.id || getVirtualSessionId(s.recurringTrainingId, s.date),
          date: s.date.toISOString(),
          name: s.trainingName || 'Training',
          startTime: s.startTime,
          endTime: s.endTime,
          groups: s.groups.map((g) => g.name),
          attendanceMarked: stored ? stored._count.attendanceRecords > 0 : false,
        };
      });

    // Get pending athlete approvals count
    const pendingApprovals = await prisma.athleteProfile.count({
      where: {
        status: 'PENDING',
      },
    });

    // Get system settings for absence thresholds
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' },
    });
    const absenceThreshold = settings?.absenceAlertThreshold ?? 3;
    const absenceWindowDays = settings?.absenceAlertWindowDays ?? 30;

    // Get athletes with high absence counts based on actual attendance records
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - absenceWindowDays);

    // Get all unexcused absences in the window, grouped by athlete
    const absenceRecords = await prisma.attendanceRecord.groupBy({
      by: ['athleteId'],
      where: {
        status: 'ABSENT_UNEXCUSED',
        markedAt: { gte: thirtyDaysAgo },
      },
      _count: {
        athleteId: true,
      },
      having: {
        athleteId: {
          _count: {
            gte: absenceThreshold,
          },
        },
      },
    });

    // Get athlete details for those exceeding threshold
    const athleteIdsWithHighAbsence = absenceRecords.map((r) => r.athleteId);
    
    let athletesNeedingAttention: { id: string; name: string; absenceCount: number; alertDate: string }[] = [];
    
    if (athleteIdsWithHighAbsence.length > 0) {
      const athleteDetails = await prisma.athleteProfile.findMany({
        where: {
          id: { in: athleteIdsWithHighAbsence },
        },
        include: {
          user: true,
        },
      });

      athletesNeedingAttention = absenceRecords.map((record) => {
        const athlete = athleteDetails.find((a) => a.id === record.athleteId);
        return {
          id: record.athleteId,
          name: athlete ? `${athlete.user.firstName} ${athlete.user.lastName}` : 'Unbekannt',
          absenceCount: record._count.athleteId,
          alertDate: new Date().toISOString(), // Current date since this is real-time calculation
        };
      }).slice(0, 5);
    }

    // Count sessions this week using virtual sessions
    const virtualSessionsThisWeek = generateVirtualSessions(
      recurringTrainings,
      storedSessions.filter((s) => s.date >= startOfWeek && s.date <= now),
      startOfWeek,
      now
    );
    const sessionsThisWeek = virtualSessionsThisWeek.filter((s) => !s.isCancelled).length;

    // Count how many of those have attendance marked
    const attendanceMarkedThisWeek = virtualSessionsThisWeek.filter((s) => {
      if (s.isCancelled) return false;
      const dateKey = `${s.recurringTrainingId}_${s.date.toISOString().split('T')[0]}`;
      const stored = storedSessionsByKey.get(dateKey);
      return stored ? stored._count.attendanceRecords > 0 : false;
    }).length;

    // Get today's sessions
    const todaysDate = now.toISOString().split('T')[0];
    const todaysSessions = virtualSessions.filter((s) => {
      const sessionDate = s.date.toISOString().split('T')[0];
      return sessionDate === todaysDate && !s.isCancelled;
    }).map((s) => {
      const dateKey = `${s.recurringTrainingId}_${s.date.toISOString().split('T')[0]}`;
      const stored = storedSessionsByKey.get(dateKey);
      return {
        id: s.id || getVirtualSessionId(s.recurringTrainingId, s.date),
        date: s.date.toISOString(),
        name: s.trainingName || 'Training',
        startTime: s.startTime,
        endTime: s.endTime,
        groups: s.groups.map((g) => g.name),
        athleteCount: s.groups.reduce((sum, g) => sum + (g.athleteCount || 0), 0),
        attendanceMarked: stored ? stored._count.attendanceRecords > 0 : false,
      };
    });

    // Get total athletes count (for admin stats)
    let totalAthletes = 0;
    let totalTrainers = 0;
    let totalActiveTrainings = 0;
    
    if (isAdmin) {
      totalAthletes = await prisma.athleteProfile.count({
        where: { status: 'ACTIVE' },
      });
      totalTrainers = await prisma.trainerProfile.count({
        where: { isActive: true },
      });
      totalActiveTrainings = await prisma.recurringTraining.count({
        where: { isActive: true },
      });
    }

    const data = {
      upcomingSessions,
      todaysSessions,
      pendingApprovals,
      athletesNeedingAttention,
      stats: {
        sessionsThisWeek,
        attendanceMarkedThisWeek,
        totalAthletes,
        totalTrainers,
        totalActiveTrainings,
      },
      isAdmin,
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
