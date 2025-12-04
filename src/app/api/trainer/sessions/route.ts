import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateVirtualSessions, getVirtualSessionId } from '@/lib/sessions/virtual-sessions';

interface GroupSessionData {
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
  attendanceMarked: boolean;
  expectedAthletes: number;
  confirmedAthletes: number;
  declinedAthletes: number;
  presentCount: number;
  equipment: string | null;
  trainers: {
    id: string;
    name: string;
    cancelled: boolean;
    confirmed: boolean;
  }[];
  trainerCancelled: boolean;
  trainerCancellationId?: string;
  trainerConfirmed: boolean;
  isVirtual: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    if (session.user.activeRole !== 'TRAINER' && session.user.activeRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Default to current week if no dates provided
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    defaultStart.setHours(0, 0, 0, 0);
    
    const defaultEnd = new Date(defaultStart);
    defaultEnd.setDate(defaultStart.getDate() + 6); // Sunday
    defaultEnd.setHours(23, 59, 59, 999);

    const startDate = startDateParam ? new Date(startDateParam) : defaultStart;
    const endDate = endDateParam ? new Date(endDateParam) : defaultEnd;

    const isAdmin = session.user.activeRole === 'ADMIN';
    const trainerProfileId = session.user.trainerProfileId;

    // For non-admin trainers, get only their assigned training groups
    let trainingGroupIds: string[] | null = null;
    let recurringTrainingIds: string[] | null = null;

    if (!isAdmin && trainerProfileId) {
      const trainerAssignments = await prisma.recurringTrainingTrainerAssignment.findMany({
        where: { trainerId: trainerProfileId },
        include: {
          trainingGroup: {
            include: { recurringTraining: true },
          },
        },
      });

      trainingGroupIds = trainerAssignments.map((a) => a.trainingGroupId);
      recurringTrainingIds = Array.from(new Set(
        trainerAssignments.map((a) => a.trainingGroup.recurringTrainingId)
      ));

      // If trainer has no assignments, return empty data
      if (trainingGroupIds.length === 0) {
        return NextResponse.json({ data: [] });
      }
    }

    // Fetch recurring trainings with their groups
    const recurringTrainings = await prisma.recurringTraining.findMany({
      where: { 
        isActive: true,
        ...(recurringTrainingIds ? { id: { in: recurringTrainingIds } } : {}),
      },
      include: {
        trainingGroups: {
          ...(trainingGroupIds ? { where: { id: { in: trainingGroupIds } } } : {}),
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
        date: {
          gte: startDate,
          lte: endDate,
        },
        ...(recurringTrainingIds ? { recurringTrainingId: { in: recurringTrainingIds } } : {}),
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

      // Get confirmed trainers for this session
      const confirmedTrainerIds = new Set(
        stored?.sessionConfirmations?.filter(c => c.trainerId && c.confirmed).map(c => c.trainerId) || []
      );

      // Create one entry per group
      for (const group of vs.groups) {
        // Get trainers for this specific group
        const recurringTraining = recurringTrainings.find(rt => rt.id === vs.recurringTrainingId);
        const trainingGroup = recurringTraining?.trainingGroups.find(g => g.id === group.id);
        
        const groupTrainers = trainingGroup?.trainerAssignments.map(ta => ({
          id: ta.trainerId,
          name: `${ta.trainer.user.firstName} ${ta.trainer.user.lastName}`,
          cancelled: trainerCancellationIds.has(ta.trainerId),
          confirmed: confirmedTrainerIds.has(ta.trainerId),
        })) || [];

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
          attendanceMarked: hasAttendance,
          expectedAthletes: group.athleteCount,
          confirmedAthletes,
          declinedAthletes,
          presentCount,
          equipment: stored?.equipment || null,
          trainers: groupTrainers,
          trainerCancelled,
          trainerCancellationId: trainerCancellation?.id,
          trainerConfirmed,
          isVirtual: vs.id === null,
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
  } catch (error) {
    console.error('Sessions API error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Trainingseinheiten' },
      { status: 500 }
    );
  }
}
