import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUnacknowledgedAlerts, getAbsenceAlertConfig } from '@/lib/services/absenceAlertService';
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

    // Get stored unacknowledged alerts
    const storedAlerts = await getUnacknowledgedAlerts();

    // Get current settings
    const settings = await getAbsenceAlertConfig();

    // Calculate athletes with high absences in real-time
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - settings.windowDays);

    // Get athletes with unexcused absences above threshold
    const athletesWithAbsences = await prisma.attendanceRecord.groupBy({
      by: ['athleteId'],
      where: {
        status: 'ABSENT_UNEXCUSED',
        markedAt: { gte: windowStart },
      },
      _count: { id: true },
      having: {
        id: { _count: { gte: settings.threshold } },
      },
    });

    // Get athlete details for those with high absences
    const athleteIds = athletesWithAbsences.map((a) => a.athleteId);
    const athletes = await prisma.athleteProfile.findMany({
      where: { id: { in: athleteIds } },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    // Map to include absence count
    const calculatedWarnings = athletesWithAbsences.map((record) => {
      const athlete = athletes.find((a) => a.id === record.athleteId);
      return {
        athleteId: record.athleteId,
        absenceCount: record._count.id,
        period: settings.windowDays,
        athlete: athlete ? {
          id: athlete.id,
          user: {
            firstName: athlete.user.firstName,
            lastName: athlete.user.lastName,
            email: athlete.user.email,
          },
        } : null,
      };
    }).filter((w) => w.athlete !== null);

    return NextResponse.json({
      success: true,
      data: storedAlerts,
      calculatedWarnings,
      settings: {
        threshold: settings.threshold,
        windowDays: settings.windowDays,
        cooldownDays: settings.cooldownDays,
        isEnabled: settings.isEnabled,
      },
    });
  } catch (error) {
    console.error('Alerts fetch error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Warnungen' },
      { status: 500 }
    );
  }
}
