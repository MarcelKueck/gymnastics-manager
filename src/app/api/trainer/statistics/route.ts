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

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Overview stats
    const totalAthletes = await prisma.athleteProfile.count();
    const activeAthletes = await prisma.athleteProfile.count({
      where: { status: 'ACTIVE' },
    });

    const totalSessions = await prisma.trainingSession.count({
      where: {
        date: { gte: thirtyDaysAgo },
        isCancelled: false,
      },
    });

    // Attendance stats
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        markedAt: { gte: thirtyDaysAgo },
      },
    });

    const present = attendanceRecords.filter((r) => r.status === 'PRESENT').length;
    const absentExcused = attendanceRecords.filter((r) => r.status === 'ABSENT_EXCUSED').length;
    const absentUnexcused = attendanceRecords.filter((r) => r.status === 'ABSENT_UNEXCUSED').length;
    
    const totalRecords = attendanceRecords.length;
    const averageAttendance = totalRecords > 0
      ? Math.round((present / totalRecords) * 100)
      : 0;

    // Weekly stats (last 4 weeks)
    const weekly = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);

      const weekSessions = await prisma.trainingSession.count({
        where: {
          date: {
            gte: weekStart,
            lt: weekEnd,
          },
          isCancelled: false,
        },
      });

      const weekRecords = await prisma.attendanceRecord.findMany({
        where: {
          markedAt: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
      });

      const weekPresent = weekRecords.filter((r) => r.status === 'PRESENT').length;
      const weekTotal = weekRecords.length;
      const weekRate = weekTotal > 0 ? Math.round((weekPresent / weekTotal) * 100) : 0;

      weekly.push({
        week: `KW ${getWeekNumber(weekStart)}`,
        sessions: weekSessions,
        attendanceRate: weekRate,
      });
    }

    // Group stats
    const groups = await prisma.trainingGroup.findMany({
      include: {
        athleteAssignments: {
          include: {
            athlete: {
              include: {
                attendanceRecords: {
                  where: {
                    markedAt: { gte: thirtyDaysAgo },
                  },
                },
              },
            },
          },
        },
      },
    });

    const groupStats = groups.map((group) => {
      let totalGroupRecords = 0;
      let presentGroupRecords = 0;

      group.athleteAssignments.forEach((athleteAssignment) => {
        athleteAssignment.athlete.attendanceRecords.forEach((record) => {
          totalGroupRecords++;
          if (record.status === 'PRESENT') {
            presentGroupRecords++;
          }
        });
      });

      return {
        name: group.name,
        athleteCount: group.athleteAssignments.length,
        attendanceRate: totalGroupRecords > 0
          ? Math.round((presentGroupRecords / totalGroupRecords) * 100)
          : 0,
      };
    });

    const data = {
      overview: {
        totalAthletes,
        activeAthletes,
        totalSessions,
        averageAttendance,
      },
      attendance: {
        present,
        absentExcused,
        absentUnexcused,
      },
      weekly: weekly.reverse(), // Oldest first
      groupStats: groupStats.sort((a, b) => b.attendanceRate - a.attendanceRate),
    };

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Statistics API error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Statistiken' },
      { status: 500 }
    );
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
