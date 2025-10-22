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

// GET - Get trainer hours for a specific month
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
          include: {
            groups: {
              include: {
                trainerAssignments: true,
              },
            },
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
          include: {
            lastModifiedByUser: true,
          },
        });

        if (existingSummary) {
          return {
            id: existingSummary.id,
            trainerId: trainer.id,
            trainerName: `${trainer.firstName} ${trainer.lastName}`,
            calculatedHours: Number(existingSummary.calculatedHours),
            adjustedHours: existingSummary.adjustedHours ? Number(existingSummary.adjustedHours) : null,
            finalHours: Number(existingSummary.finalHours),
            notes: existingSummary.notes,
            lastModifiedBy: existingSummary.lastModifiedByUser
              ? `${existingSummary.lastModifiedByUser.firstName} ${existingSummary.lastModifiedByUser.lastName}`
              : null,
            lastModifiedAt: existingSummary.lastModifiedAt,
            sessionCount: sessions.length,
          };
        } else {
          return {
            id: null,
            trainerId: trainer.id,
            trainerName: `${trainer.firstName} ${trainer.lastName}`,
            calculatedHours,
            adjustedHours: null,
            finalHours: calculatedHours,
            notes: null,
            lastModifiedBy: null,
            lastModifiedAt: null,
            sessionCount: sessions.length,
          };
        }
      })
    );

    return NextResponse.json({
      month: month + 1, // Return 1-indexed month
      year,
      trainers: trainerHoursData,
    });
  } catch (error) {
    console.error('Error fetching trainer hours:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trainer hours' },
      { status: 500 }
    );
  }
}

// POST - Calculate and save trainer hours for a specific month
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { month, year } = body; // month is 1-indexed (1-12)

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Invalid month or year' },
        { status: 400 }
      );
    }

    // Calculate hours for each trainer
    const trainers = await prisma.trainer.findMany({
      where: {
        isActive: true,
      },
    });

    const monthStart = startOfMonth(new Date(year, month - 1, 1));
    const monthEnd = endOfMonth(new Date(year, month - 1, 1));

    for (const trainer of trainers) {
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

      // Upsert the summary
      await prisma.monthlyTrainerSummary.upsert({
        where: {
          trainerId_month_year: {
            trainerId: trainer.id,
            month,
            year,
          },
        },
        update: {
          calculatedHours,
          finalHours: calculatedHours, // Update finalHours only if not manually adjusted
        },
        create: {
          trainerId: trainer.id,
          month,
          year,
          calculatedHours,
          finalHours: calculatedHours,
        },
      });
    }

    return NextResponse.json({
      message: 'Trainer hours calculated successfully',
      month,
      year,
    });
  } catch (error) {
    console.error('Error calculating trainer hours:', error);
    return NextResponse.json(
      { error: 'Failed to calculate trainer hours' },
      { status: 500 }
    );
  }
}

// PATCH - Update trainer hours (admin adjustments)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { summaryId, adjustedHours, notes } = body;

    if (!summaryId) {
      return NextResponse.json(
        { error: 'Summary ID is required' },
        { status: 400 }
      );
    }

    const summary = await prisma.monthlyTrainerSummary.findUnique({
      where: { id: summaryId },
    });

    if (!summary) {
      return NextResponse.json(
        { error: 'Summary not found' },
        { status: 404 }
      );
    }

    // Update the summary
    const updatedSummary = await prisma.monthlyTrainerSummary.update({
      where: { id: summaryId },
      data: {
        adjustedHours: adjustedHours !== null ? adjustedHours : null,
        finalHours: adjustedHours !== null ? adjustedHours : summary.calculatedHours,
        notes: notes || null,
        lastModifiedBy: session.user.id,
        lastModifiedAt: new Date(),
      },
      include: {
        trainer: true,
        lastModifiedByUser: true,
      },
    });

    return NextResponse.json({
      message: 'Trainer hours updated successfully',
      summary: {
        id: updatedSummary.id,
        trainerId: updatedSummary.trainerId,
        trainerName: `${updatedSummary.trainer.firstName} ${updatedSummary.trainer.lastName}`,
        calculatedHours: Number(updatedSummary.calculatedHours),
        adjustedHours: updatedSummary.adjustedHours ? Number(updatedSummary.adjustedHours) : null,
        finalHours: Number(updatedSummary.finalHours),
        notes: updatedSummary.notes,
        lastModifiedBy: updatedSummary.lastModifiedByUser
          ? `${updatedSummary.lastModifiedByUser.firstName} ${updatedSummary.lastModifiedByUser.lastName}`
          : null,
        lastModifiedAt: updatedSummary.lastModifiedAt,
      },
    });
  } catch (error) {
    console.error('Error updating trainer hours:', error);
    return NextResponse.json(
      { error: 'Failed to update trainer hours' },
      { status: 500 }
    );
  }
}
