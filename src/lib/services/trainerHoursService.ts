import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, differenceInMinutes } from 'date-fns';

export class TrainerHoursService {
  /**
   * Calculate trainer hours for a month
   */
  async calculateMonthlyHours(trainerId: string, month: number, year: number) {
    const monthStart = startOfMonth(new Date(year, month - 1, 1));
    const monthEnd = endOfMonth(new Date(year, month - 1, 1));

    // Get all sessions where trainer was assigned
    const sessions = await prisma.trainingSession.findMany({
      where: {
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
        isCompleted: true,
        isCancelled: false,
        groups: {
          some: {
            trainerAssignments: {
              some: { trainerId },
            },
          },
        },
      },
      include: {
        groups: {
          include: {
            trainerAssignments: {
              where: { trainerId },
            },
          },
        },
      },
    });

    let totalMinutes = 0;

    // Calculate hours based on session duration
    sessions.forEach((session) => {
      if (!session.startTime || !session.endTime) return;

      const [startHour, startMin] = session.startTime.split(':').map(Number);
      const [endHour, endMin] = session.endTime.split(':').map(Number);

      const startDate = new Date(session.date);
      startDate.setHours(startHour, startMin, 0, 0);

      const endDate = new Date(session.date);
      endDate.setHours(endHour, endMin, 0, 0);

      const minutes = differenceInMinutes(endDate, startDate);
      totalMinutes += minutes;
    });

    const hours = totalMinutes / 60;

    return {
      trainerId,
      month,
      year,
      calculatedHours: Number(hours.toFixed(2)),
      sessionsCount: sessions.length,
    };
  }

  /**
   * Get or create monthly summary
   */
  async getOrCreateMonthlySummary(trainerId: string, month: number, year: number) {
    let summary = await prisma.monthlyTrainerSummary.findUnique({
      where: {
        trainerId_month_year: {
          trainerId,
          month,
          year,
        },
      },
      include: {
        trainer: true,
        lastModifiedByUser: true,
      },
    });

    if (!summary) {
      // Calculate hours
      const calculated = await this.calculateMonthlyHours(trainerId, month, year);

      // Create summary
      summary = await prisma.monthlyTrainerSummary.create({
        data: {
          trainerId,
          month,
          year,
          calculatedHours: calculated.calculatedHours,
          finalHours: calculated.calculatedHours,
        },
        include: {
          trainer: true,
          lastModifiedByUser: true,
        },
      });
    }

    return summary;
  }

  /**
   * Update monthly summary hours (admin adjustment)
   */
  async adjustMonthlyHours(
    trainerId: string,
    month: number,
    year: number,
    adjustedHours: number,
    adjustedBy: string,
    notes?: string
  ) {
    // Get or create summary
    const summary = await this.getOrCreateMonthlySummary(trainerId, month, year);

    // Update with adjusted hours
    return prisma.monthlyTrainerSummary.update({
      where: { id: summary.id },
      data: {
        adjustedHours,
        finalHours: adjustedHours,
        notes,
        lastModifiedBy: adjustedBy,
        lastModifiedAt: new Date(),
      },
      include: {
        trainer: true,
        lastModifiedByUser: true,
      },
    });
  }

  /**
   * Recalculate all summaries for a month
   */
  async recalculateMonth(month: number, year: number) {
    // Get all active trainers
    const trainers = await prisma.trainer.findMany({
      where: { isActive: true },
    });

    const results = [];

    for (const trainer of trainers) {
      const calculated = await this.calculateMonthlyHours(trainer.id, month, year);

      // Update or create summary
      const summary = await prisma.monthlyTrainerSummary.upsert({
        where: {
          trainerId_month_year: {
            trainerId: trainer.id,
            month,
            year,
          },
        },
        create: {
          trainerId: trainer.id,
          month,
          year,
          calculatedHours: calculated.calculatedHours,
          finalHours: calculated.calculatedHours,
        },
        update: {
          calculatedHours: calculated.calculatedHours,
          // Only update finalHours if not manually adjusted
          finalHours: {
            set: calculated.calculatedHours,
          },
        },
      });

      results.push(summary);
    }

    return results;
  }

  /**
   * Get trainer summaries for a period
   */
  async getTrainerSummaries(trainerId: string, months: number = 12) {
    const today = new Date();
    const summaries = [];

    for (let i = 0; i < months; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const summary = await this.getOrCreateMonthlySummary(trainerId, month, year);
      summaries.push(summary);
    }

    return summaries;
  }

  /**
   * Get all summaries for a month (admin view)
   */
  async getAllSummariesForMonth(month: number, year: number) {
    const trainers = await prisma.trainer.findMany({
      where: { isActive: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    const summaries = [];

    for (const trainer of trainers) {
      const summary = await this.getOrCreateMonthlySummary(trainer.id, month, year);
      summaries.push(summary);
    }

    return summaries;
  }

  /**
   * Export trainer hours to CSV format
   */
  async exportToCSV(month: number, year: number) {
    const summaries = await this.getAllSummariesForMonth(month, year);

    const headers = [
      'Trainer',
      'Berechnete Stunden',
      'Angepasste Stunden',
      'Finale Stunden',
      'Notizen',
      'Zuletzt geändert',
      'Geändert von',
    ];

    const rows = summaries.map((summary) => [
      `${summary.trainer.firstName} ${summary.trainer.lastName}`,
      summary.calculatedHours.toString(),
      summary.adjustedHours?.toString() || '',
      summary.finalHours.toString(),
      summary.notes || '',
      summary.lastModifiedAt?.toLocaleDateString('de-DE') || '',
      summary.lastModifiedByUser
        ? `${summary.lastModifiedByUser.firstName} ${summary.lastModifiedByUser.lastName}`
        : '',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(';')).join('\n');

    return {
      content: csvContent,
      filename: `trainer-stunden-${year}-${month.toString().padStart(2, '0')}.csv`,
    };
  }
}

export const trainerHoursService = new TrainerHoursService();