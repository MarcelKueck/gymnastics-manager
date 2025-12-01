import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    if (session.user.activeRole !== 'TRAINER' && session.user.activeRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    const { id } = await params;

    const athlete = await prisma.athleteProfile.findUnique({
      where: { id },
      include: {
        user: true,
        recurringTrainingAssignments: {
          include: {
            trainingGroup: true,
          },
        },
        attendanceRecords: {
          where: {
            markedAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
            },
          },
          include: {
            trainingSession: {
              include: {
                recurringTraining: true,
              },
            },
          },
          orderBy: {
            markedAt: 'desc',
          },
        },
        absenceAlerts: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!athlete) {
      return NextResponse.json({ error: 'Athlet nicht gefunden' }, { status: 404 });
    }

    // Calculate stats
    const totalSessions = athlete.attendanceRecords.length;
    const presentCount = athlete.attendanceRecords.filter(
      (r) => r.status === 'PRESENT'
    ).length;
    const absentExcusedCount = athlete.attendanceRecords.filter(
      (r) => r.status === 'ABSENT_EXCUSED'
    ).length;
    const absentUnexcusedCount = athlete.attendanceRecords.filter(
      (r) => r.status === 'ABSENT_UNEXCUSED'
    ).length;
    const attendanceRate = totalSessions > 0
      ? Math.round((presentCount / totalSessions) * 100)
      : 0;

    const data = {
      id: athlete.id,
      name: `${athlete.user.firstName} ${athlete.user.lastName}`,
      email: athlete.user.email,
      phone: athlete.user.phone,
      status: athlete.status,
      youthCategory: athlete.youthCategory,
      birthDate: athlete.user.birthDate?.toISOString(),
      groups: athlete.recurringTrainingAssignments.map((a) => a.trainingGroup.name),
      joinedAt: athlete.createdAt.toISOString(),
      stats: {
        totalSessions,
        presentCount,
        absentExcusedCount,
        absentUnexcusedCount,
        attendanceRate,
      },
      recentAttendance: athlete.attendanceRecords.map((record) => ({
        sessionId: record.trainingSessionId,
        date: record.trainingSession.date.toISOString(),
        trainingName: record.trainingSession.recurringTraining?.name || 'Training',
        status: record.status,
        note: record.notes,
      })),
      alerts: athlete.absenceAlerts.map((alert) => ({
        id: alert.id,
        createdAt: alert.createdAt.toISOString(),
        absenceCount: alert.absenceCount,
        acknowledged: alert.acknowledged,
      })),
    };

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Athlete detail API error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden des Athleten' },
      { status: 500 }
    );
  }
}
