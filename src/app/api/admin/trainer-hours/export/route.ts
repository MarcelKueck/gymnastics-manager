import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth } from 'date-fns';

// Helper function to calculate hours from time strings (HH:MM format)
function calculateHoursDifference(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startInMinutes = startHour * 60 + startMinute;
  const endInMinutes = endHour * 60 + endMinute;
  
  const diffInMinutes = endInMinutes - startInMinutes;
  return diffInMinutes / 60; // Convert to hours
}

// GET - Export trainer hours as CSV
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const month = parseInt(searchParams.get('month') || new Date().getMonth().toString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // Calculate hours for each trainer
    const trainers = await prisma.trainer.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        lastName: 'asc',
      },
    });

    const monthStart = startOfMonth(new Date(year, month, 1));
    const monthEnd = endOfMonth(new Date(year, month, 1));

    const trainerHoursData = await Promise.all(
      trainers.map(async (trainer) => {
        // Get all sessions the trainer was assigned to in this month
        const sessions = await prisma.trainingSession.findMany({
          where: {
            date: {
              gte: monthStart,
              lte: monthEnd,
            },
            groups: {
              some: {
                trainerAssignments: {
                  some: {
                    trainerId: trainer.id,
                  },
                },
              },
            },
            isCancelled: false,
            isCompleted: true, // Only count completed sessions
          },
        });

        // Calculate total hours
        let calculatedHours = 0;
        sessions.forEach((session) => {
          if (session.startTime && session.endTime) {
            calculatedHours += calculateHoursDifference(
              session.startTime,
              session.endTime
            );
          }
        });

        // Check if there's an existing summary
        const existingSummary = await prisma.monthlyTrainerSummary.findUnique({
          where: {
            trainerId_month_year: {
              trainerId: trainer.id,
              month: month + 1, // Convert 0-indexed to 1-indexed
              year,
            },
          },
        });

        const finalHours = existingSummary?.adjustedHours 
          ? Number(existingSummary.adjustedHours) 
          : calculatedHours;

        return {
          trainerName: `${trainer.firstName} ${trainer.lastName}`,
          calculatedHours,
          adjustedHours: existingSummary?.adjustedHours ? Number(existingSummary.adjustedHours) : null,
          finalHours,
          sessionCount: sessions.length,
          notes: existingSummary?.notes || '',
        };
      })
    );

    // Generate CSV
    const monthName = new Date(year, month, 1).toLocaleDateString('de-DE', { month: 'long' });
    const csvHeader = 'Trainer,Berechnete Stunden,Angepasste Stunden,Finale Stunden,Anzahl Trainings,Notizen\n';
    const csvRows = trainerHoursData.map((data) => {
      return [
        data.trainerName,
        data.calculatedHours.toFixed(2),
        data.adjustedHours !== null ? data.adjustedHours.toFixed(2) : '',
        data.finalHours.toFixed(2),
        data.sessionCount,
        `"${data.notes.replace(/"/g, '""')}"`, // Escape quotes in notes
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="trainer-stunden-${monthName}-${year}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting trainer hours:', error);
    return NextResponse.json(
      { error: 'Failed to export trainer hours' },
      { status: 500 }
    );
  }
}
