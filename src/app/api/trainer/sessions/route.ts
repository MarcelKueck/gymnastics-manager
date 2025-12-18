import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateVirtualSessions, getVirtualSessionId } from '@/lib/sessions/virtual-sessions';

interface GroupSessionData {
  id: string;
  sessionId: string;
  recurringTrainingId: string;
  trainingGroupId: string;
  groupName: string;
  date: string;
  trainingName: string;
  startTime: string;
  endTime: string;
  isCancelled: boolean;
  isCompleted?: boolean;
  attendanceMarked: boolean;
  expectedAthletes: number;
  confirmedAthletes: number;
  declinedAthletes: number;
  presentCount: number;
  equipment: string | null;
  trainers: Array<{
    id: string;
    name: string;
    cancelled: boolean;
    confirmed: boolean | null;  // BUG FIX #1: Changed to allow null
  }>;
  trainerCancelled: boolean;
  trainerCancellationId?: string;
  trainerCancellationReason?: string;
  trainerConfirmed: boolean;
  isVirtual: boolean;
  isOwnGroup: boolean;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  }

  if (session.user.activeRole !== 'TRAINER' && session.user.activeRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('from');
    const endDateParam = searchParams.get('to');
    
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(defaultStart.getDate() - defaultStart.getDay() + 1);
    defaultStart.setHours(0, 0, 0, 0);
    
    const defaultEnd = new Date(defaultStart);
    defaultEnd.setDate(defaultEnd.getDate() + 6);
    defaultEnd.setHours(23, 59, 59, 999);

    const startDate = startDateParam ? new Date(startDateParam) : defaultStart;
    const endDate = endDateParam ? new Date(endDateParam) : defaultEnd;

    const isAdmin = session.user.activeRole === 'ADMIN';
    const trainerProfileId = session.user.trainerProfileId;

    // For non-admin trainers, get their assigned training groups (for marking as "own")
    // but still show all groups for visibility
    let ownTrainingGroupIds: Set<string> = new Set();

    if (!isAdmin && trainerProfileId) {
      const trainerAssignments = await prisma.recurringTrainingTrainerAssignment.findMany({
        where: { trainerId: trainerProfileId },
        select: { trainingGroupId: true },
      });

      ownTrainingGroupIds = new Set(trainerAssignments.map((a) => a.trainingGroupId));
    }

    // Fetch ALL recurring trainings with their groups (trainers can see all)
    const recurringTrainings = await prisma.recurringTraining.findMany({
      where: { 
        isActive: true,
      },
      include: {
        trainingGroups: {
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

    // Fetch system settings for response
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' },
    });
    const confirmationMode = settings?.attendanceConfirmationMode || 'AUTO_CONFIRM';
    const cancellationDeadlineHours = settings?.cancellationDeadlineHours || 2;

    // Fetch any stored sessions in this date range (all sessions for visibility)
    const storedSessions = await prisma.trainingSession.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        _count: {
          select: { attendanceRecords: true },
        },
        trainerCancellations: {
          where: { isActive: true },
        },
        sessionConfirmations: true,
        attendanceRecords: {
          select: {
            trainingGroupId: true,
            status: true,
          },
        },
        sessionGroups: {
          select: {
            trainingGroupId: true,
            equipment: true,
          },
        },
      },
    });

    // Create stored sessions map
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

    // Transform to GROUP-BASED API response format (one entry per group)
    const data: GroupSessionData[] = [];

    for (const vs of virtualSessions) {
      const dateKey = `${vs.recurringTrainingId}_${vs.date.toISOString().split('T')[0]}`;
      const stored = storedSessionsByKey.get(dateKey);
      const sessionId = vs.id || getVirtualSessionId(vs.recurringTrainingId, vs.date);

      // Get trainer cancellations for this session
      const trainerCancellationIds = new Set(
        stored?.trainerCancellations?.map(tc => tc.trainerId) || []
      );

      // BUG FIX #1: Build proper trainer confirmation maps
      // Get trainers who explicitly confirmed
      const confirmedTrainerIds = new Set(
        stored?.sessionConfirmations?.filter(c => c.trainerId && c.confirmed === true).map(c => c.trainerId) || []
      );
      // Get trainers who explicitly declined
      const declinedTrainerIds = new Set(
        stored?.sessionConfirmations?.filter(c => c.trainerId && c.confirmed === false).map(c => c.trainerId) || []
      );

      // Create one entry per group
      for (const group of vs.groups) {
        // Get trainers for this specific group
        const recurringTraining = recurringTrainings.find(rt => rt.id === vs.recurringTrainingId);
        const trainingGroup = recurringTraining?.trainingGroups.find(g => g.id === group.id);
        
        // BUG FIX #1: Return proper confirmation status (true/false/null)
        const groupTrainers = trainingGroup?.trainerAssignments.map(ta => {
          let confirmed: boolean | null = null;
          if (confirmedTrainerIds.has(ta.trainerId)) {
            confirmed = true;
          } else if (declinedTrainerIds.has(ta.trainerId)) {
            confirmed = false;
          }
          // null means no explicit response
          
          return {
            id: ta.trainerId,
            name: `${ta.trainer.user.firstName} ${ta.trainer.user.lastName}`,
            cancelled: trainerCancellationIds.has(ta.trainerId),
            confirmed,
          };
        }) || [];

        // Check if current trainer is cancelled for this session
        const trainerCancelled = trainerProfileId ? trainerCancellationIds.has(trainerProfileId) : false;
        const trainerCancellation = stored?.trainerCancellations?.find(tc => tc.trainerId === trainerProfileId);
        
        // Check if current trainer is confirmed
        const trainerConfirmed = trainerProfileId ? confirmedTrainerIds.has(trainerProfileId) : false;

        // Count confirmations for this specific group
        const groupConfirmations = stored?.sessionConfirmations?.filter(
          c => c.athleteId && c.trainingGroupId === group.id
        ) || [];
        const confirmedAthletes = groupConfirmations.filter(c => c.confirmed).length;
        const declinedAthletes = groupConfirmations.filter(c => !c.confirmed).length;

        // Count attendance for this specific group
        const groupAttendance = stored?.attendanceRecords?.filter(
          r => r.trainingGroupId === group.id
        ) || [];
        const presentCount = groupAttendance.filter(r => r.status === 'PRESENT').length;
        const hasAttendance = groupAttendance.length > 0;

        // Get equipment for this specific group
        const groupEquipment = stored?.sessionGroups?.find(
          sg => sg.trainingGroupId === group.id
        )?.equipment || null;

        // Calculate expected athletes for this session date
        // Only count athletes who were assigned before or on the session date
        const sessionDateOnly = new Date(vs.date.getFullYear(), vs.date.getMonth(), vs.date.getDate());
        const expectedAthletes = trainingGroup?.athleteAssignments?.filter(a => {
          const assignedAtDate = new Date(a.assignedAt.getFullYear(), a.assignedAt.getMonth(), a.assignedAt.getDate());
          return assignedAtDate <= sessionDateOnly;
        }).length || 0;

        // Create unique ID for this group session
        const groupSessionId = vs.id 
          ? `${vs.id}_group_${group.id}`
          : `${getVirtualSessionId(vs.recurringTrainingId, vs.date)}_group_${group.id}`;

        // Check if this is the trainer's own group
        const isOwnGroup = isAdmin || ownTrainingGroupIds.has(group.id);

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
          isCompleted: stored?.isCompleted,
          attendanceMarked: hasAttendance,
          expectedAthletes,
          confirmedAthletes,
          declinedAthletes,
          presentCount,
          equipment: groupEquipment,
          trainers: groupTrainers,
          trainerCancelled,
          trainerCancellationId: trainerCancellation?.id,
          trainerCancellationReason: trainerCancellation?.reason,
          trainerConfirmed,
          isVirtual: vs.id === null,
          isOwnGroup,
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

    return NextResponse.json({ 
      data,
      confirmationMode,
      cancellationDeadlineHours,
    });
  } catch (error) {
    console.error('Sessions API error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Trainingseinheiten' },
      { status: 500 }
    );
  }
}