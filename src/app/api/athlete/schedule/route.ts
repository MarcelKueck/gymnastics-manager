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
  const weeksAhead = parseInt(searchParams.get('weeks') || '4');

  const startDate = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const endDate = addDays(startDate, weeksAhead * 7);

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

    // Fetch recurring trainings with their groups
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
        attendanceRecords: {
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

    // Generate virtual sessions
    const virtualSessions = generateVirtualSessions(
      recurringTrainings,
      storedSessions,
      startDate,
      endDate
    );

    return NextResponse.json({
      data: virtualSessions.map((vs) => {
        const dateKey = `${vs.recurringTrainingId}_${vs.date.toISOString().split('T')[0]}`;
        const stored = storedSessionsByKey.get(dateKey);
        
        return {
          id: vs.id || getVirtualSessionId(vs.recurringTrainingId, vs.date),
          date: vs.date.toISOString(),
          name: vs.trainingName,
          startTime: vs.startTime,
          endTime: vs.endTime,
          isCancelled: vs.isCancelled,
          cancellationReason: vs.cancellationReason,
          athleteCancelled: stored?.cancellations?.length ? stored.cancellations.length > 0 : false,
          athleteCancellationReason: stored?.cancellations?.[0]?.reason,
          isCompleted: stored?.isCompleted || false,
          attendanceStatus: stored?.attendanceRecords?.[0]?.status,
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
