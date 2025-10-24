import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/authHelpers';
import { absenceAlertService } from '@/lib/services/absenceAlertService';
import { settingsService } from '@/lib/services/settingsService';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await requireAdmin();

    // Get system settings to determine threshold
    const settings = await settingsService.getSettings();

    // Get all athletes with their recent absence alerts
    const recentAlerts = await absenceAlertService.getAllRecentAlerts(
      settings.absenceAlertWindowDays,
      100
    );

    // Group by athlete and get detailed information
    const athleteMap = new Map<
      string,
      {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        absenceCount: number;
        lastAlertDate?: string;
        recentAbsences: Array<{
          date: string;
          trainingName: string;
        }>;
      }
    >();

    for (const alert of recentAlerts) {
      const athlete = alert.athlete;
      const existing = athleteMap.get(athlete.id);

      if (!existing || new Date(alert.sentAt) > new Date(existing.lastAlertDate || 0)) {
        // Get recent sessions where athlete was absent or didn't show up
        const recentAbsences = await prisma.trainingSession.findMany({
          where: {
            date: {
              gte: alert.absencePeriodStart,
              lte: alert.absencePeriodEnd,
            },
            OR: [
              {
                attendanceRecords: {
                  some: {
                    athleteId: athlete.id,
                    status: 'ABSENT_UNEXCUSED',
                  },
                },
              },
              {
                AND: [
                  {
                    date: {
                      lt: new Date(),
                    },
                  },
                  {
                    NOT: {
                      cancellations: {
                        some: {
                          athleteId: athlete.id,
                        },
                      },
                    },
                  },
                  {
                    NOT: {
                      attendanceRecords: {
                        some: {
                          athleteId: athlete.id,
                        },
                      },
                    },
                  },
                ],
              },
            ],
          },
          include: {
            recurringTraining: true,
          },
          orderBy: {
            date: 'desc',
          },
          take: 5,
        });

        athleteMap.set(athlete.id, {
          id: athlete.id,
          firstName: athlete.firstName,
          lastName: athlete.lastName,
          email: athlete.email,
          absenceCount: alert.absenceCount,
          lastAlertDate: alert.sentAt.toISOString(),
          recentAbsences: recentAbsences.map((session: any) => ({
            date: session.date.toISOString(),
            trainingName: session.recurringTraining?.name || 'Training',
          })),
        });
      }
    }

    const athletesWithAbsences = Array.from(athleteMap.values()).sort(
      (a, b) => b.absenceCount - a.absenceCount
    );

    return NextResponse.json({
      success: true,
      data: athletesWithAbsences,
    });
  } catch (error) {
    console.error('Error fetching absence alerts:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
