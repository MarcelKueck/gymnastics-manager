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
    // Get trainer's cancellations for this period
    const trainerCancellations = await prisma.trainerCancellation.findMany({
      where: {
        trainerId: trainer.id,
        isActive: true,
        trainingSession: {
          date: { gte: startDate, lte: endDate },
        },
      },
      select: { trainingSessionId: true },
    });
    const cancelledSessionIds = new Set(trainerCancellations.map(c => c.trainingSessionId));

    // First, try to get sessions where trainer is directly assigned via sessionGroups
    const sessionsWithDirectAssignment = await prisma.trainingSession.findMany({
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
      },
    });

    // Also get sessions via recurring training trainer assignments
    // (for sessions that don't have specific session group assignments)
    const sessionsViaRecurring = await prisma.trainingSession.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        isCancelled: false,
        isCompleted: true,
        recurringTraining: {
          trainingGroups: {
            some: {
              trainerAssignments: {
                some: { trainerId: trainer.id },
              },
            },
          },
        },
      },
      include: {
        recurringTraining: true,
      },
    });

    // Merge and deduplicate sessions by ID, excluding cancelled sessions
    const sessionMap = new Map<string, typeof sessionsWithDirectAssignment[0]>();
    for (const session of [...sessionsWithDirectAssignment, ...sessionsViaRecurring]) {
      // Exclude sessions where trainer cancelled
      if (!cancelledSessionIds.has(session.id)) {
        sessionMap.set(session.id, session);
      }
    }
    const sessions = Array.from(sessionMap.values());

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

  // Get trainer's cancellations for this period
  const trainerCancellations = await prisma.trainerCancellation.findMany({
    where: {
      trainerId,
      isActive: true,
      trainingSession: {
        date: { gte: startDate, lte: endDate },
      },
    },
    select: { trainingSessionId: true },
  });
  const cancelledSessionIds = new Set(trainerCancellations.map(c => c.trainingSessionId));

  // Get sessions via direct session group assignments
  const sessionsWithDirectAssignment = await prisma.trainingSession.findMany({
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
      recurringTraining: {
        include: {
          trainingGroups: true,
        },
      },
      sessionGroups: {
        include: {
          trainingGroup: true,
        },
      },
    },
    orderBy: { date: 'asc' },
  });

  // Also get sessions via recurring training trainer assignments
  const sessionsViaRecurring = await prisma.trainingSession.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      isCancelled: false,
      isCompleted: true,
      recurringTraining: {
        trainingGroups: {
          some: {
            trainerAssignments: {
              some: { trainerId },
            },
          },
        },
      },
    },
    include: {
      recurringTraining: {
        include: {
          trainingGroups: {
            where: {
              trainerAssignments: {
                some: { trainerId },
              },
            },
          },
        },
      },
      sessionGroups: {
        include: {
          trainingGroup: true,
        },
      },
    },
    orderBy: { date: 'asc' },
  });

  // Merge and deduplicate, excluding cancelled sessions
  const sessionMap = new Map<string, typeof sessionsWithDirectAssignment[0]>();
  for (const session of [...sessionsWithDirectAssignment, ...sessionsViaRecurring]) {
    if (!cancelledSessionIds.has(session.id)) {
      sessionMap.set(session.id, session);
    }
  }
  const sessions = Array.from(sessionMap.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  return sessions.map((session) => {
    const startTime = session.startTime || session.recurringTraining?.startTime || '00:00';
    const endTime = session.endTime || session.recurringTraining?.endTime || '00:00';
    
    // Get group names from session groups if available, otherwise from recurring training
    const groupNames = session.sessionGroups.length > 0
      ? session.sessionGroups.map((sg) => sg.trainingGroup.name)
      : session.recurringTraining?.trainingGroups.map((g) => g.name) || [];
    
    return {
      id: session.id,
      date: session.date,
      trainingName: session.recurringTraining?.name || 'Training',
      startTime,
      endTime,
      durationHours: calculateDurationHours(startTime, endTime),
      groupNames,
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
