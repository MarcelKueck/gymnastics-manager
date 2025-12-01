import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface TrainerHoursSummary {
  trainerId: string;
  trainerName: string;
  month: number;
  year: number;
  calculatedHours: number;
  adjustedHours: number | null;
  finalHours: number;
  notes: string | null;
  sessionCount: number;
}

export interface SessionDetail {
  id: string;
  date: Date;
  trainingName: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  groupNames: string[];
}

/**
 * Calculate the duration in hours between two time strings (HH:MM format)
 */
function calculateDurationHours(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return (endMinutes - startMinutes) / 60;
}

/**
 * Get all trainers with their monthly hours for a specific month/year
 */
export async function getTrainerHoursForMonth(
  month: number,
  year: number
): Promise<TrainerHoursSummary[]> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Get all active trainers
  const trainers = await prisma.trainerProfile.findMany({
    where: { isActive: true },
    include: {
      user: {
        select: { firstName: true, lastName: true },
      },
    },
  });

  const summaries: TrainerHoursSummary[] = [];

  for (const trainer of trainers) {
    // Get sessions where this trainer was assigned
    const sessions = await prisma.trainingSession.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        isCancelled: false,
        isCompleted: true,
        sessionGroups: {
          some: {
            trainerAssignments: {
              some: { trainerId: trainer.id },
            },
          },
        },
      },
      include: {
        recurringTraining: true,
        sessionGroups: {
          include: {
            trainerAssignments: {
              where: { trainerId: trainer.id },
            },
          },
        },
      },
    });

    // Calculate total hours
    let calculatedHours = 0;
    for (const session of sessions) {
      const startTime = session.startTime || session.recurringTraining?.startTime || '00:00';
      const endTime = session.endTime || session.recurringTraining?.endTime || '00:00';
      calculatedHours += calculateDurationHours(startTime, endTime);
    }

    // Check for existing saved summary
    const savedSummary = await prisma.monthlyTrainerSummary.findUnique({
      where: {
        month_year_trainerId: {
          month,
          year,
          trainerId: trainer.id,
        },
      },
    });

    summaries.push({
      trainerId: trainer.id,
      trainerName: `${trainer.user.firstName} ${trainer.user.lastName}`,
      month,
      year,
      calculatedHours: Math.round(calculatedHours * 100) / 100,
      adjustedHours: savedSummary?.adjustedHours ? Number(savedSummary.adjustedHours) : null,
      finalHours: savedSummary?.finalHours 
        ? Number(savedSummary.finalHours) 
        : Math.round(calculatedHours * 100) / 100,
      notes: savedSummary?.notes || null,
      sessionCount: sessions.length,
    });
  }

  return summaries.sort((a, b) => a.trainerName.localeCompare(b.trainerName));
}

/**
 * Get detailed session list for a trainer in a specific month
 */
export async function getTrainerSessionDetails(
  trainerId: string,
  month: number,
  year: number
): Promise<SessionDetail[]> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const sessions = await prisma.trainingSession.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      isCancelled: false,
      isCompleted: true,
      sessionGroups: {
        some: {
          trainerAssignments: {
            some: { trainerId },
          },
        },
      },
    },
    include: {
      recurringTraining: true,
      sessionGroups: {
        where: {
          trainerAssignments: {
            some: { trainerId },
          },
        },
        include: {
          trainingGroup: true,
        },
      },
    },
    orderBy: { date: 'asc' },
  });

  return sessions.map((session) => {
    const startTime = session.startTime || session.recurringTraining?.startTime || '00:00';
    const endTime = session.endTime || session.recurringTraining?.endTime || '00:00';
    
    return {
      id: session.id,
      date: session.date,
      trainingName: session.recurringTraining?.name || 'Training',
      startTime,
      endTime,
      durationHours: calculateDurationHours(startTime, endTime),
      groupNames: session.sessionGroups.map((sg) => sg.trainingGroup.name),
    };
  });
}

/**
 * Save or update a trainer's monthly hours summary with adjustments
 */
export async function saveTrainerHoursSummary(
  trainerId: string,
  month: number,
  year: number,
  data: {
    adjustedHours?: number | null;
    notes?: string;
  },
  modifiedByTrainerId: string
): Promise<void> {
  // First calculate the current hours
  const summaries = await getTrainerHoursForMonth(month, year);
  const trainerSummary = summaries.find((s) => s.trainerId === trainerId);
  
  if (!trainerSummary) {
    throw new Error('Trainer nicht gefunden');
  }

  const calculatedHours = new Prisma.Decimal(trainerSummary.calculatedHours);
  const adjustedHours = data.adjustedHours !== undefined && data.adjustedHours !== null
    ? new Prisma.Decimal(data.adjustedHours)
    : null;
  const finalHours = adjustedHours || calculatedHours;

  await prisma.monthlyTrainerSummary.upsert({
    where: {
      month_year_trainerId: {
        month,
        year,
        trainerId,
      },
    },
    create: {
      month,
      year,
      trainerId,
      calculatedHours,
      adjustedHours,
      finalHours,
      notes: data.notes,
      lastModifiedBy: modifiedByTrainerId,
      lastModifiedAt: new Date(),
    },
    update: {
      calculatedHours,
      adjustedHours,
      finalHours,
      notes: data.notes,
      lastModifiedBy: modifiedByTrainerId,
      lastModifiedAt: new Date(),
    },
  });
}

/**
 * Export trainer hours to CSV format
 */
export function exportTrainerHoursToCSV(summaries: TrainerHoursSummary[]): string {
  const headers = [
    'Trainer',
    'Monat',
    'Jahr',
    'Berechnete Stunden',
    'Angepasste Stunden',
    'Finale Stunden',
    'Anzahl Trainings',
    'Notizen',
  ];

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  const rows = summaries.map((s) => [
    s.trainerName,
    monthNames[s.month - 1],
    s.year.toString(),
    s.calculatedHours.toFixed(2).replace('.', ','),
    s.adjustedHours !== null ? s.adjustedHours.toFixed(2).replace('.', ',') : '',
    s.finalHours.toFixed(2).replace('.', ','),
    s.sessionCount.toString(),
    s.notes || '',
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(';')),
  ].join('\n');

  return csvContent;
}
