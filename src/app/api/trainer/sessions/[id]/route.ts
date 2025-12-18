import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseVirtualSessionId } from '@/lib/sessions/virtual-sessions';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Parse group session ID format: "sessionId_group_groupId"
function parseGroupSessionId(id: string): { sessionId: string; groupId: string | null } {
  const parts = id.split('_group_');
  if (parts.length === 2) {
    return { sessionId: parts[0], groupId: parts[1] };
  }
  return { sessionId: id, groupId: null };
}

// GET - Get session details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    if (session.user.activeRole !== 'TRAINER' && session.user.activeRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    const { id } = await params;

    // Parse group ID if present
    const { sessionId: parsedSessionId, groupId: filterGroupId } = parseGroupSessionId(id);

    // Check if this is a virtual session ID
    const virtualInfo = parseVirtualSessionId(parsedSessionId);
    
    let trainingSession;
    let recurringTraining;
    
    if (virtualInfo) {
      // Virtual session - check if it exists or fetch from recurring training
      const existingSession = await prisma.trainingSession.findFirst({
        where: {
          recurringTrainingId: virtualInfo.recurringTrainingId,
          date: virtualInfo.date,
        },
        include: {
          recurringTraining: {
            include: {
              trainingGroups: {
                ...(filterGroupId ? { where: { id: filterGroupId } } : {}),
                include: {
                  athleteAssignments: {
                    include: {
                      athlete: {
                        include: { user: true },
                      },
                    },
                  },
                  trainerAssignments: {
                    include: {
                      trainer: {
                        include: { user: true },
                      },
                    },
                  },
                },
              },
            },
          },
          cancellations: {
            where: { isActive: true },
          },
          attendanceRecords: true,
          sessionGroups: true,
          sessionConfirmations: true,
          trainerCancellations: {
            where: { isActive: true },
          },
          trainerAttendanceRecords: true,
        },
      });

      if (existingSession) {
        trainingSession = existingSession;
        recurringTraining = existingSession.recurringTraining;
      } else {
        // Fetch recurring training for virtual session
        recurringTraining = await prisma.recurringTraining.findUnique({
          where: { id: virtualInfo.recurringTrainingId },
          include: {
            trainingGroups: {
              ...(filterGroupId ? { where: { id: filterGroupId } } : {}),
              include: {
                athleteAssignments: {
                  include: {
                    athlete: {
                      include: { user: true },
                    },
                  },
                },
                trainerAssignments: {
                  include: {
                    trainer: {
                      include: { user: true },
                    },
                  },
                },
              },
            },
          },
        });

        if (!recurringTraining) {
          return NextResponse.json({ error: 'Training nicht gefunden' }, { status: 404 });
        }

        // Create a virtual session object
        trainingSession = {
          id: parsedSessionId,
          date: virtualInfo.date,
          startTime: recurringTraining.startTime,
          endTime: recurringTraining.endTime,
          isCancelled: false,
          isCompleted: false,
          cancellations: [],
          attendanceRecords: [],
          sessionGroups: [],
          sessionConfirmations: [],
          trainerCancellations: [],
          trainerAttendanceRecords: [],
        };
      }
    } else {
      // Real session ID
      trainingSession = await prisma.trainingSession.findUnique({
        where: { id: parsedSessionId },
        include: {
          recurringTraining: {
            include: {
              trainingGroups: {
                ...(filterGroupId ? { where: { id: filterGroupId } } : {}),
                include: {
                  athleteAssignments: {
                    include: {
                      athlete: {
                        include: { user: true },
                      },
                    },
                  },
                  trainerAssignments: {
                    include: {
                      trainer: {
                        include: { user: true },
                      },
                    },
                  },
                },
              },
            },
          },
          cancellations: {
            where: { isActive: true },
          },
          attendanceRecords: true,
          sessionGroups: true,
          sessionConfirmations: true,
          trainerCancellations: {
            where: { isActive: true },
          },
          trainerAttendanceRecords: true,
        },
      });

      if (!trainingSession) {
        return NextResponse.json({ error: 'Training nicht gefunden' }, { status: 404 });
      }

      recurringTraining = trainingSession.recurringTraining;
    }

    // Get session date for assignment filtering
    const sessionDate = trainingSession.date instanceof Date 
      ? trainingSession.date 
      : new Date(trainingSession.date);
    const sessionDateOnly = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());

    // Build athlete map from assignments - filter by assignment date
    const athleteMap = new Map<string, { athleteId: string; name: string; group: string; groupId: string }>();
    if (recurringTraining) {
      for (const group of recurringTraining.trainingGroups) {
        for (const assignment of group.athleteAssignments) {
          // Only include athletes who were assigned before or on the session date
          const assignedAtDate = new Date(assignment.assignedAt);
          assignedAtDate.setHours(0, 0, 0, 0);
          if (assignedAtDate > sessionDateOnly) continue;
          
          athleteMap.set(assignment.athleteId, {
            athleteId: assignment.athleteId,
            name: `${assignment.athlete.user.firstName} ${assignment.athlete.user.lastName}`,
            group: group.name,
            groupId: group.id,
          });
        }
      }
    }

    // Build attendance data
    const attendanceMap = new Map(
      (trainingSession.attendanceRecords as Array<{ athleteId: string; status: string; notes: string | null; isLate?: boolean }>)
        .map((r) => [r.athleteId, r])
    );

    // Build cancellation data
    const cancellationMap = new Map(
      (trainingSession.cancellations as Array<{ athleteId: string; reason: string; isLate?: boolean }>)
        .map((c) => [c.athleteId, c])
    );

    // Build confirmation data
    const athleteConfirmations = (trainingSession.sessionConfirmations as Array<{ athleteId: string | null; trainerId: string | null; trainingGroupId: string | null; confirmed: boolean; declineReason: string | null }>)
      .filter((c) => c.athleteId !== null);
    const confirmationMap = new Map<string, { confirmed: boolean; declineReason: string | null }>();
    for (const c of athleteConfirmations) {
      if (c.athleteId) {
        if (c.trainingGroupId) {
          confirmationMap.set(`${c.athleteId}_${c.trainingGroupId}`, { confirmed: c.confirmed, declineReason: c.declineReason });
        }
        confirmationMap.set(c.athleteId, { confirmed: c.confirmed, declineReason: c.declineReason });
      }
    }

    // Build trainer data
    const trainerCancellations = trainingSession.trainerCancellations as Array<{ trainerId: string }>;
    const trainerCancellationSet = new Set(trainerCancellations.map((tc) => tc.trainerId));
    
    const trainerAttendanceMap = new Map(
      (trainingSession.trainerAttendanceRecords as Array<{ trainerId: string; status: string; notes: string | null; isLate?: boolean }>)
        .map((r) => [r.trainerId, r])
    );
    
    const trainerConfirmations = (trainingSession.sessionConfirmations as Array<{ athleteId: string | null; trainerId: string | null; trainingGroupId: string | null; confirmed: boolean; declineReason: string | null }>)
      .filter((c) => c.trainerId !== null);
    const trainerConfirmationMap = new Map<string, { confirmed: boolean; declineReason: string | null }>();
    for (const c of trainerConfirmations) {
      if (c.trainerId) {
        if (c.trainingGroupId) {
          trainerConfirmationMap.set(`${c.trainerId}_${c.trainingGroupId}`, { confirmed: c.confirmed, declineReason: c.declineReason });
        }
        trainerConfirmationMap.set(c.trainerId, { confirmed: c.confirmed, declineReason: c.declineReason });
      }
    }

    // Build trainers list
    const trainerMap = new Map<string, {
      id: string;
      name: string;
      cancelled: boolean;
      confirmed: boolean | null;
      declineReason?: string | null;
      attendanceStatus: string | null;
      attendanceNote?: string;
      isLate?: boolean;
    }>();
    
    if (recurringTraining) {
      for (const group of recurringTraining.trainingGroups) {
        for (const assignment of group.trainerAssignments) {
          // Check if trainer assignment is effective for this session date
          const effectiveFrom = assignment.effectiveFrom ? new Date(assignment.effectiveFrom) : null;
          const effectiveUntil = assignment.effectiveUntil ? new Date(assignment.effectiveUntil) : null;
          
          if (effectiveFrom) {
            const effectiveFromDate = new Date(effectiveFrom);
            effectiveFromDate.setHours(0, 0, 0, 0);
            if (effectiveFromDate > sessionDateOnly) continue;
          }
          
          if (effectiveUntil) {
            const effectiveUntilDate = new Date(effectiveUntil);
            effectiveUntilDate.setHours(0, 0, 0, 0);
            if (effectiveUntilDate < sessionDateOnly) continue;
          }
          
          if (!trainerMap.has(assignment.trainerId)) {
            const attendance = trainerAttendanceMap.get(assignment.trainerId);
            const confirmation = trainerConfirmationMap.get(`${assignment.trainerId}_${group.id}`) || 
                               trainerConfirmationMap.get(assignment.trainerId);
            
            trainerMap.set(assignment.trainerId, {
              id: assignment.trainerId,
              name: `${assignment.trainer.user.firstName} ${assignment.trainer.user.lastName}`,
              cancelled: trainerCancellationSet.has(assignment.trainerId),
              confirmed: confirmation?.confirmed ?? null,
              declineReason: confirmation?.declineReason,
              attendanceStatus: attendance?.status || null,
              attendanceNote: attendance?.notes || undefined,
              isLate: attendance?.isLate,
            });
          }
        }
      }
    }
    
    const trainers = Array.from(trainerMap.values());

    // Build athletes list
    const athletes = Array.from(athleteMap.values()).map((athlete) => {
      const attendance = attendanceMap.get(athlete.athleteId);
      const cancellation = cancellationMap.get(athlete.athleteId);
      const confirmation = confirmationMap.get(`${athlete.athleteId}_${athlete.groupId}`) || 
                          confirmationMap.get(athlete.athleteId);
      
      return {
        id: athlete.athleteId,
        athleteId: athlete.athleteId,
        name: athlete.name,
        group: athlete.group,
        groupId: athlete.groupId,
        status: attendance?.status || null,
        note: attendance?.notes || undefined,
        isLate: attendance?.isLate || false,
        hasCancellation: !!cancellation,
        cancellationNote: cancellation?.reason || undefined,
        cancellationIsLate: cancellation?.isLate || false, // BUG FIX #7: Include isLate from cancellation
        confirmed: confirmation?.confirmed ?? null,
        declineReason: confirmation?.declineReason || undefined,
      };
    });

    // Sort athletes by group and name
    athletes.sort((a, b) => {
      if (a.group !== b.group) return a.group.localeCompare(b.group);
      return a.name.localeCompare(b.name);
    });

    // Get group name and equipment if filtering
    const groupName = filterGroupId && recurringTraining?.trainingGroups[0]?.name;
    const sessionGroups = trainingSession.sessionGroups as Array<{ trainingGroupId: string; equipment: string | null }>;
    const groupEquipment = filterGroupId 
      ? sessionGroups.find(sg => sg.trainingGroupId === filterGroupId)?.equipment || null
      : null;

    // Check if current trainer is assigned to this group
    const isAdmin = session.user.activeRole === 'ADMIN';
    const trainerProfileId = session.user.trainerProfileId;
    let isOwnGroup = isAdmin;
    
    if (!isAdmin && trainerProfileId && filterGroupId) {
      const trainerAssignment = await prisma.recurringTrainingTrainerAssignment.findUnique({
        where: {
          trainingGroupId_trainerId: {
            trainingGroupId: filterGroupId,
            trainerId: trainerProfileId,
          },
        },
      });
      isOwnGroup = !!trainerAssignment;
    } else if (!isAdmin && trainerProfileId && !filterGroupId) {
      const trainerAssignments = await prisma.recurringTrainingTrainerAssignment.findMany({
        where: { trainerId: trainerProfileId },
        select: { trainingGroupId: true },
      });
      const ownGroupIds = new Set(trainerAssignments.map(a => a.trainingGroupId));
      isOwnGroup = recurringTraining?.trainingGroups.some((g) => ownGroupIds.has(g.id)) || false;
    }

    const data = {
      id: id,
      sessionId: typeof trainingSession.id === 'string' ? trainingSession.id : parsedSessionId,
      recurringTrainingId: virtualInfo?.recurringTrainingId || recurringTraining?.id,
      trainingGroupId: filterGroupId,
      groupName: groupName || null,
      date: sessionDate.toISOString(),
      name: recurringTraining?.name || 'Training',
      startTime: recurringTraining?.startTime || trainingSession.startTime || '',
      endTime: recurringTraining?.endTime || trainingSession.endTime || '',
      groups: recurringTraining?.trainingGroups.map((g) => ({ id: g.id, name: g.name })) || [],
      isCancelled: trainingSession.isCancelled,
      isVirtual: parsedSessionId.startsWith('virtual_'),
      isOwnGroup,
      equipment: groupEquipment,
      athletes,
      trainers,
    };

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Session detail API error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Trainingseinheit' },
      { status: 500 }
    );
  }
}

// BUG FIX #6: PATCH - Update session group (equipment, notes, etc.) - NO DEADLINE CHECK
// Equipment should always be editable, even for past sessions
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    if (session.user.activeRole !== 'TRAINER' && session.user.activeRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { equipment } = body;

    // Parse group ID if present
    const { sessionId: parsedSessionId, groupId } = parseGroupSessionId(id);

    if (!groupId) {
      return NextResponse.json({ error: 'Gruppen-ID fehlt' }, { status: 400 });
    }

    // Check if trainer is authorized to edit this group
    const isAdmin = session.user.activeRole === 'ADMIN';
    const trainerProfileId = session.user.trainerProfileId;
    
    if (!isAdmin && trainerProfileId) {
      const trainerAssignment = await prisma.recurringTrainingTrainerAssignment.findUnique({
        where: {
          trainingGroupId_trainerId: {
            trainingGroupId: groupId,
            trainerId: trainerProfileId,
          },
        },
      });
      
      if (!trainerAssignment) {
        return NextResponse.json({ error: 'Keine Berechtigung für diese Gruppe' }, { status: 403 });
      }
    }

    // BUG FIX #6: NO deadline check for equipment editing
    // Equipment should be editable at any time, even after the session

    let trainingSession;
    let sessionGroup;

    // Check if this is a virtual session ID
    const virtualInfo = parseVirtualSessionId(parsedSessionId);

    if (virtualInfo) {
      // Check if session already exists
      const existingSession = await prisma.trainingSession.findFirst({
        where: {
          recurringTrainingId: virtualInfo.recurringTrainingId,
          date: virtualInfo.date,
        },
      });

      if (existingSession) {
        trainingSession = existingSession;
      } else {
        // Get recurring training details
        const recurringTraining = await prisma.recurringTraining.findUnique({
          where: { id: virtualInfo.recurringTrainingId },
          include: { trainingGroups: true },
        });

        if (!recurringTraining) {
          return NextResponse.json({ error: 'Training nicht gefunden' }, { status: 404 });
        }

        // Create the session
        trainingSession = await prisma.trainingSession.create({
          data: {
            recurringTrainingId: virtualInfo.recurringTrainingId,
            date: virtualInfo.date,
            dayOfWeek: recurringTraining.dayOfWeek,
            startTime: recurringTraining.startTime,
            endTime: recurringTraining.endTime,
            sessionGroups: {
              create: recurringTraining.trainingGroups.map((g) => ({
                trainingGroupId: g.id,
              })),
            },
          },
        });
      }

      // Update or create session group with equipment
      sessionGroup = await prisma.sessionGroup.upsert({
        where: {
          trainingSessionId_trainingGroupId: {
            trainingSessionId: trainingSession.id,
            trainingGroupId: groupId,
          },
        },
        create: {
          trainingSessionId: trainingSession.id,
          trainingGroupId: groupId,
          equipment: equipment || null,
        },
        update: {
          equipment: equipment || null,
        },
      });
    } else {
      // Real session ID
      trainingSession = await prisma.trainingSession.findUnique({
        where: { id: parsedSessionId },
      });

      if (!trainingSession) {
        return NextResponse.json({ error: 'Training nicht gefunden' }, { status: 404 });
      }

      sessionGroup = await prisma.sessionGroup.upsert({
        where: {
          trainingSessionId_trainingGroupId: {
            trainingSessionId: parsedSessionId,
            trainingGroupId: groupId,
          },
        },
        create: {
          trainingSessionId: parsedSessionId,
          trainingGroupId: groupId,
          equipment: equipment || null,
        },
        update: {
          equipment: equipment || null,
        },
      });
    }

    return NextResponse.json({ 
      data: sessionGroup,
      message: 'Geräte erfolgreich aktualisiert',
    });
  } catch (error) {
    console.error('Session PATCH error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Trainingseinheit' },
      { status: 500 }
    );
  }
}