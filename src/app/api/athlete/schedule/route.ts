import { NextRequest, NextResponse } from 'next/server';
import { requireAthlete } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { startOfWeek, addDays } from 'date-fns';
import { generateVirtualSessions, getVirtualSessionId } from '@/lib/sessions/virtual-sessions';

export async function GET(request: NextRequest) {
  const { session, error } = await requireAthlete();
  if (error) return error;

  const athleteId = session!.user.athleteProfileId!;
  const searchParams = request.nextUrl.searchParams;
  
  // Support both weeks-based and date-range queries
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');
  const weeksAhead = parseInt(searchParams.get('weeks') || '4');

  let startDate: Date;
  let endDate: Date;

  if (startDateParam && endDateParam) {
    startDate = new Date(startDateParam);
    endDate = new Date(endDateParam);
    // Ensure end of day for endDate
    endDate.setHours(23, 59, 59, 999);
  } else {
    startDate = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
    endDate = addDays(startDate, weeksAhead * 7);
  }

  try {
    // Get athlete's assigned training groups
    const assignments = await prisma.recurringTrainingAthleteAssignment.findMany({
      where: { athleteId },
      include: {
        trainingGroup: {
          include: { recurringTraining: true },
        },
      },
    });

    const groupIds = assignments.map((a) => a.trainingGroupId);

    if (groupIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Get recurring trainings that this athlete is part of
    const recurringTrainingIds = Array.from(new Set(
      assignments.map((a) => a.trainingGroup.recurringTrainingId)
    ));

    // Fetch recurring trainings with their groups and trainer assignments
    const recurringTrainings = await prisma.recurringTraining.findMany({
      where: { 
        id: { in: recurringTrainingIds },
        isActive: true,
      },
      include: {
        trainingGroups: {
          where: { id: { in: groupIds } },
          include: {
            _count: {
              select: { athleteAssignments: true },
            },
            trainerAssignments: {
              include: {
                trainer: {
                  include: {
                    user: {
                      select: { firstName: true, lastName: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Fetch any stored sessions in this date range
    const storedSessions = await prisma.trainingSession.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        recurringTrainingId: { in: recurringTrainingIds },
      },
      include: {
        _count: {
          select: { attendanceRecords: true },
        },
        cancellations: {
          where: { athleteId, isActive: true },
        },
        trainerCancellations: {
          where: { isActive: true },
        },
        attendanceRecords: {
          where: { athleteId },
        },
        sessionConfirmations: {
          where: { athleteId },
        },
      },
    });

    // Create maps for stored session data
    const storedSessionsByKey = new Map(
      storedSessions.map((s) => [
        `${s.recurringTrainingId}_${s.date.toISOString().split('T')[0]}`,
        s,
      ])
    );

    // Create a map of recurring training ID to total athlete count
    const athleteCountByRecurringId = new Map<string, number>();
    for (const rt of recurringTrainings) {
      let totalAthletes = 0;
      for (const group of rt.trainingGroups) {
        totalAthletes += group._count.athleteAssignments;
      }
      athleteCountByRecurringId.set(rt.id, totalAthletes);
    }

    // Generate virtual sessions
    const virtualSessions = generateVirtualSessions(
      recurringTrainings,
      storedSessions,
      startDate,
      endDate
    );

    // Create a map of recurring training ID to trainers
    const trainersByRecurringId = new Map<string, { id: string; name: string; cancelled: boolean }[]>();
    for (const rt of recurringTrainings) {
      const trainers: { id: string; name: string; cancelled: boolean }[] = [];
      for (const group of rt.trainingGroups) {
        for (const assignment of group.trainerAssignments) {
          const trainerId = assignment.trainerId;
          if (!trainers.find(t => t.id === trainerId)) {
            trainers.push({
              id: trainerId,
              name: `${assignment.trainer.user.firstName} ${assignment.trainer.user.lastName}`,
              cancelled: false, // Will be updated per session
            });
          }
        }
      }
      trainersByRecurringId.set(rt.id, trainers);
    }

    return NextResponse.json({
      data: virtualSessions.map((vs) => {
        const dateKey = `${vs.recurringTrainingId}_${vs.date.toISOString().split('T')[0]}`;
        const stored = storedSessionsByKey.get(dateKey);
        const athleteCancellation = stored?.cancellations?.find((c) => c.isActive);
        const athleteConfirmation = stored?.sessionConfirmations?.[0];
        
        // Get trainers for this session with their cancellation status
        const baseTrainers = trainersByRecurringId.get(vs.recurringTrainingId) || [];
        const trainerCancellationIds = new Set(
          stored?.trainerCancellations?.map(tc => tc.trainerId) || []
        );
        const trainers = baseTrainers.map(t => ({
          ...t,
          cancelled: trainerCancellationIds.has(t.id),
        }));

        // Calculate confirmed athletes count
        const totalAthletes = athleteCountByRecurringId.get(vs.recurringTrainingId) || 0;
        const confirmedAthletes = stored?.sessionConfirmations?.filter(c => c.athleteId && c.confirmed).length || 0;
        const declinedAthletes = stored?.sessionConfirmations?.filter(c => c.athleteId && !c.confirmed).length || 0;
        
        return {
          id: vs.id || getVirtualSessionId(vs.recurringTrainingId, vs.date),
          date: vs.date.toISOString(),
          name: vs.trainingName,
          startTime: vs.startTime,
          endTime: vs.endTime,
          isCancelled: vs.isCancelled,
          cancellationReason: vs.cancellationReason,
          athleteCancelled: !!athleteCancellation,
          athleteCancellationId: athleteCancellation?.id,
          athleteCancellationReason: athleteCancellation?.reason,
          isCompleted: stored?.isCompleted || false,
          attendanceStatus: stored?.attendanceRecords?.[0]?.status,
          equipment: stored?.equipment || null,
          trainers,
          confirmed: athleteConfirmation?.confirmed ?? null,
          confirmedAt: athleteConfirmation?.confirmedAt?.toISOString() ?? null,
          totalAthletes,
          confirmedAthletes,
          declinedAthletes,
        };
      }),
    });
  } catch (err) {
    console.error('Schedule API error:', err);
    return NextResponse.json(
      { error: 'Fehler beim Laden des Trainingsplans' },
      { status: 500 }
    );
  }
}
