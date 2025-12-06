import { NextRequest, NextResponse } from 'next/server';
import { requireAthlete } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { startOfWeek, addDays } from 'date-fns';
import { generateVirtualSessions, getVirtualSessionId } from '@/lib/sessions/virtual-sessions';

interface GroupScheduleData {
  id: string; // Format: sessionId_groupId or virtual_recurringId_date_groupId
  sessionId: string;
  recurringTrainingId: string;
  trainingGroupId: string;
  groupName: string;
  date: string;
  trainingName: string;
  startTime: string;
  endTime: string;
  isCancelled: boolean;
  cancellationReason?: string;
  athleteCancelled: boolean;
  athleteCancellationId?: string;
  athleteCancellationReason?: string;
  isCompleted: boolean;
  attendanceStatus?: 'PRESENT' | 'ABSENT_UNEXCUSED' | 'ABSENT_EXCUSED';
  isLate?: boolean;
  equipment: string | null;
  trainers: {
    id: string;
    name: string;
    cancelled: boolean;
  }[];
  confirmed: boolean | null;
  confirmedAt: string | null;
  declineReason?: string | null;
  totalAthletes: number;
  confirmedAthletes: number;
  declinedAthletes: number;
}

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

    // Create a map of group ID to assignment for easy lookup
    const groupAssignmentMap = new Map(
      assignments.map(a => [a.trainingGroupId, a])
    );

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
            athleteAssignments: {
              select: { assignedAt: true },
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
        sessionConfirmations: true,
        sessionGroups: {
          select: {
            trainingGroupId: true,
            equipment: true,
          },
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

    // Transform to GROUP-BASED response (one entry per group the athlete is in)
    const data: GroupScheduleData[] = [];

    for (const vs of virtualSessions) {
      const dateKey = `${vs.recurringTrainingId}_${vs.date.toISOString().split('T')[0]}`;
      const stored = storedSessionsByKey.get(dateKey);
      const sessionId = vs.id || getVirtualSessionId(vs.recurringTrainingId, vs.date);
      
      // Get trainer cancellations for this session
      const trainerCancellationIds = new Set(
        stored?.trainerCancellations?.map(tc => tc.trainerId) || []
      );

      // Only include groups the athlete is assigned to
      for (const group of vs.groups) {
        const athleteAssignment = groupAssignmentMap.get(group.id);
        if (!athleteAssignment) continue;

        // Check if athlete was assigned before or on this session date
        const sessionDateOnly = new Date(vs.date.getFullYear(), vs.date.getMonth(), vs.date.getDate());
        const assignedAtDate = new Date(athleteAssignment.assignedAt.getFullYear(), athleteAssignment.assignedAt.getMonth(), athleteAssignment.assignedAt.getDate());
        if (assignedAtDate > sessionDateOnly) continue;

        // Get trainers for this specific group
        const recurringTraining = recurringTrainings.find(rt => rt.id === vs.recurringTrainingId);
        const trainingGroup = recurringTraining?.trainingGroups.find(g => g.id === group.id);
        
        const groupTrainers = trainingGroup?.trainerAssignments.map(ta => ({
          id: ta.trainerId,
          name: `${ta.trainer.user.firstName} ${ta.trainer.user.lastName}`,
          cancelled: trainerCancellationIds.has(ta.trainerId),
        })) || [];

        // Get athlete's cancellation for this session
        const athleteCancellation = stored?.cancellations?.find((c) => c.isActive);
        
        // Get athlete's confirmation for this session + group
        const athleteConfirmation = stored?.sessionConfirmations?.find(
          c => c.athleteId === athleteId && (c.trainingGroupId === group.id || c.trainingGroupId === null)
        );

        // Get athlete's attendance for this session + group
        const athleteAttendance = stored?.attendanceRecords?.find(
          r => r.athleteId === athleteId && (r.trainingGroupId === group.id || r.trainingGroupId === null)
        );

        // Get equipment for this specific group
        const groupEquipment = stored?.sessionGroups?.find(
          sg => sg.trainingGroupId === group.id
        )?.equipment || null;

        // Calculate total athletes for this group at this session date
        // Only count athletes who were assigned before or on the session date
        const totalAthletes = trainingGroup?.athleteAssignments.filter(a => {
          const aAssignedAtDate = new Date(a.assignedAt.getFullYear(), a.assignedAt.getMonth(), a.assignedAt.getDate());
          return aAssignedAtDate <= sessionDateOnly;
        }).length || 0;

        // Calculate confirmed athletes count for this group
        const groupConfirmations = stored?.sessionConfirmations?.filter(
          c => c.athleteId && (c.trainingGroupId === group.id || c.trainingGroupId === null)
        ) || [];
        const confirmedAthletes = groupConfirmations.filter(c => c.confirmed).length;
        const declinedAthletes = groupConfirmations.filter(c => !c.confirmed).length;

        // Create unique ID for this group session
        const groupSessionId = vs.id 
          ? `${vs.id}_group_${group.id}`
          : `${getVirtualSessionId(vs.recurringTrainingId, vs.date)}_group_${group.id}`;

        data.push({
          id: groupSessionId,
          sessionId,
          recurringTrainingId: vs.recurringTrainingId,
          trainingGroupId: group.id,
          groupName: group.name,
          date: vs.date.toISOString(),
          trainingName: vs.trainingName,
          startTime: vs.startTime,
          endTime: vs.endTime,
          isCancelled: vs.isCancelled,
          cancellationReason: vs.cancellationReason ?? undefined,
          athleteCancelled: !!athleteCancellation,
          athleteCancellationId: athleteCancellation?.id,
          athleteCancellationReason: athleteCancellation?.reason,
          isCompleted: stored?.isCompleted || false,
          attendanceStatus: athleteAttendance?.status as 'PRESENT' | 'ABSENT_UNEXCUSED' | 'ABSENT_EXCUSED' | undefined,
          isLate: athleteAttendance?.isLate,
          equipment: groupEquipment,
          trainers: groupTrainers,
          confirmed: athleteConfirmation?.confirmed ?? null,
          confirmedAt: athleteConfirmation?.confirmedAt?.toISOString() ?? null,
          declineReason: athleteConfirmation?.declineReason,
          totalAthletes,
          confirmedAthletes,
          declinedAthletes,
        });
      }
    }

    // Sort by date, then time, then group name
    data.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA.getTime() !== dateB.getTime()) return dateA.getTime() - dateB.getTime();
      if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
      return a.groupName.localeCompare(b.groupName);
    });

    return NextResponse.json({ data });
  } catch (err) {
    console.error('Schedule API error:', err);
    return NextResponse.json(
      { error: 'Fehler beim Laden des Trainingsplans' },
      { status: 500 }
    );
  }
}
