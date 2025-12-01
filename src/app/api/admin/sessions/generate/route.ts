import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { DayOfWeek } from '@prisma/client';

// POST - Generate training sessions from recurring trainings
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const weeksAhead = body.weeksAhead || 8; // Default 8 weeks

  // Get system settings for generation period
  const settings = await prisma.systemSettings.findUnique({
    where: { id: 'default' },
  });

  const daysAhead = settings?.sessionGenerationDaysAhead || weeksAhead * 7;

  // Get all active recurring trainings
  const recurringTrainings = await prisma.recurringTraining.findMany({
    where: { isActive: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + daysAhead);

  // Helper to get day number from DayOfWeek enum
  const getDayNumber = (day: DayOfWeek): number => {
    const dayMap: Record<DayOfWeek, number> = {
      [DayOfWeek.SUNDAY]: 0,
      [DayOfWeek.MONDAY]: 1,
      [DayOfWeek.TUESDAY]: 2,
      [DayOfWeek.WEDNESDAY]: 3,
      [DayOfWeek.THURSDAY]: 4,
      [DayOfWeek.FRIDAY]: 5,
      [DayOfWeek.SATURDAY]: 6,
    };
    return dayMap[day];
  };

  let createdCount = 0;
  let skippedCount = 0;

  for (const training of recurringTrainings) {
    // Check validity period
    if (training.validFrom && training.validFrom > endDate) continue;
    if (training.validUntil && training.validUntil < today) continue;

    const targetDay = getDayNumber(training.dayOfWeek);
    const currentDate = new Date(today);

    // Find first occurrence of this day
    const currentDay = currentDate.getDay();
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd < 0) daysToAdd += 7;
    currentDate.setDate(currentDate.getDate() + daysToAdd);

    // Generate sessions for each week
    while (currentDate <= endDate) {
      // Check validity period for this specific date
      if (training.validFrom && currentDate < training.validFrom) {
        currentDate.setDate(currentDate.getDate() + 7);
        continue;
      }
      if (training.validUntil && currentDate > training.validUntil) {
        break;
      }

      // Check if session already exists for this date
      const existingSession = await prisma.trainingSession.findFirst({
        where: {
          recurringTrainingId: training.id,
          date: currentDate,
        },
      });

      if (!existingSession) {
        await prisma.trainingSession.create({
          data: {
            recurringTrainingId: training.id,
            date: new Date(currentDate),
            dayOfWeek: training.dayOfWeek,
            startTime: training.startTime,
            endTime: training.endTime,
          },
        });
        createdCount++;
      } else {
        skippedCount++;
      }

      // Move to next week (or every 2 weeks for biweekly)
      const increment = training.recurrence === 'BIWEEKLY' ? 14 : 7;
      currentDate.setDate(currentDate.getDate() + increment);
    }
  }

  return NextResponse.json({
    success: true,
    message: `${createdCount} Sessions erstellt, ${skippedCount} bereits vorhanden`,
    created: createdCount,
    skipped: skippedCount,
  });
}
