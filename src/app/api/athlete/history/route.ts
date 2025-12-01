import { NextResponse } from 'next/server';
import { requireAthlete } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, subMonths, format } from 'date-fns';
import { de } from 'date-fns/locale';

export async function GET() {
  const { session, error } = await requireAthlete();
  if (error) return error;

  const athleteId = session!.user.athleteProfileId!;

  try {
    // Get all attendance records for the athlete
    const records = await prisma.attendanceRecord.findMany({
      where: { athleteId },
      include: {
        trainingSession: {
          include: { recurringTraining: true },
        },
      },
      orderBy: { trainingSession: { date: 'desc' } },
      take: 50, // Limit to last 50 records
    });

    // Calculate monthly stats for last 6 months
    const monthlyStats = [];
    for (let i = 0; i < 6; i++) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = startOfMonth(subMonths(new Date(), i - 1));

      const monthRecords = records.filter((r) => {
        const date = new Date(r.trainingSession.date);
        return date >= monthStart && date < monthEnd;
      });

      if (monthRecords.length > 0) {
        const present = monthRecords.filter((r) => r.status === 'PRESENT').length;
        const absent = monthRecords.filter((r) => r.status === 'ABSENT_UNEXCUSED').length;
        const excused = monthRecords.filter((r) => r.status === 'ABSENT_EXCUSED').length;
        const total = monthRecords.length;
        const rate = Math.round((present / total) * 100);

        monthlyStats.push({
          month: format(monthStart, 'MMMM yyyy', { locale: de }),
          total,
          present,
          absent,
          excused,
          rate,
        });
      }
    }

    return NextResponse.json({
      data: {
        records: records.map((r) => ({
          id: r.id,
          date: r.trainingSession.date.toISOString(),
          name: r.trainingSession.recurringTraining?.name || 'Training',
          startTime: r.trainingSession.startTime || r.trainingSession.recurringTraining?.startTime || '00:00',
          endTime: r.trainingSession.endTime || r.trainingSession.recurringTraining?.endTime || '00:00',
          status: r.status,
          notes: r.notes,
        })),
        stats: monthlyStats,
      },
    });
  } catch (err) {
    console.error('History API error:', err);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Historie' },
      { status: 500 }
    );
  }
}
