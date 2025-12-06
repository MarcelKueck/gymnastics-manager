import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { addDays, subDays } from 'date-fns';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const thirtyDaysAhead = addDays(now, 30);

    // User stats
    const [
      totalAthletes,
      pendingAthletes,
      activeAthletes,
      inactiveAthletes,
      totalTrainers,
      activeTrainers,
    ] = await Promise.all([
      prisma.athleteProfile.count(),
      prisma.athleteProfile.count({ where: { status: 'PENDING' } }),
      prisma.athleteProfile.count({ where: { status: 'ACTIVE' } }),
      prisma.athleteProfile.count({ where: { status: 'INACTIVE' } }),
      prisma.trainerProfile.count(),
      prisma.trainerProfile.count({ where: { isActive: true } }),
    ]);

    // Training stats
    const [activeTrainings, totalGroups] = await Promise.all([
      prisma.recurringTraining.count({ where: { isActive: true } }),
      prisma.trainingGroup.count(),
    ]);

    // Competition stats
    const [
      upcomingCompetitions,
      totalRegistrations,
    ] = await Promise.all([
      prisma.competition.findMany({
        where: {
          date: { gte: now, lte: thirtyDaysAhead },
        },
        include: {
          _count: { select: { registrations: true } },
        },
        orderBy: { date: 'asc' },
        take: 5,
      }),
      prisma.competitionRegistration.count({
        where: {
          competition: {
            date: { gte: now },
          },
        },
      }),
    ]);

    // Recent activity
    const [
      recentRegistrations,
      recentAbsenceAlerts,
    ] = await Promise.all([
      prisma.athleteProfile.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: true },
      }),
      prisma.absenceAlert.findMany({
        where: { createdAt: { gte: subDays(now, 7) } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          athlete: { include: { user: true } },
        },
      }),
    ]);

    // Attendance stats for this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const attendanceStats = await prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: {
        markedAt: { gte: startOfMonth },
      },
      _count: true,
    });

    const attendanceSummary = {
      present: attendanceStats.find(s => s.status === 'PRESENT')?._count || 0,
      absentUnexcused: attendanceStats.find(s => s.status === 'ABSENT_UNEXCUSED')?._count || 0,
      absentExcused: attendanceStats.find(s => s.status === 'ABSENT_EXCUSED')?._count || 0,
    };

    // Files stats
    const recentFiles = await prisma.upload.count({
      where: { uploadedAt: { gte: thirtyDaysAgo } },
    });

    return NextResponse.json({
      data: {
        users: {
          totalAthletes,
          pendingAthletes,
          activeAthletes,
          inactiveAthletes,
          totalTrainers,
          activeTrainers,
        },
        trainings: {
          activeTrainings,
          totalGroups,
        },
        competitions: {
          upcoming: upcomingCompetitions.map(c => ({
            id: c.id,
            name: c.name,
            date: c.date.toISOString(),
            location: c.location,
            registrations: c._count.registrations,
            registrationDeadline: c.registrationDeadline?.toISOString(),
          })),
          totalRegistrations,
        },
        recentActivity: {
          newAthletes: recentRegistrations.map(a => ({
            id: a.id,
            name: `${a.user.firstName} ${a.user.lastName}`,
            status: a.status,
            createdAt: a.createdAt.toISOString(),
          })),
          absenceAlerts: recentAbsenceAlerts.map(a => ({
            id: a.id,
            athleteName: `${a.athlete.user.firstName} ${a.athlete.user.lastName}`,
            sentAt: a.createdAt.toISOString(),
            acknowledged: a.acknowledgedAt !== null,
          })),
        },
        attendanceSummary,
        recentFiles,
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err) {
    console.error('Admin Dashboard API error:', err);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Dashboard-Daten' },
      { status: 500 }
    );
  }
}
