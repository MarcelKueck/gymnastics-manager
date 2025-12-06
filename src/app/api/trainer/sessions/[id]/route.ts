import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseVirtualSessionId } from '@/lib/sessions/virtual-sessions';

// Helper to parse group session ID
// Format: virtual_{recurringTrainingId}_{date}_group_{groupId}
// Or legacy: virtual_{recurringTrainingId}_{date} (no group)
// Or real session: {sessionId} or {sessionId}_group_{groupId}
function parseGroupSessionId(id: string): { sessionId: string; groupId: string | null } {
  // Check for new format with _group_ marker
  const groupMatch = id.match(/^(.+)_group_(.+)$/);
  if (groupMatch) {
    return { sessionId: groupMatch[1], groupId: groupMatch[2] };
  }
  
  // Legacy format without group ID
  return { sessionId: id, groupId: null };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    
    // Parse the ID to extract group ID if present
    const { sessionId: parsedSessionId, groupId: filterGroupId } = parseGroupSessionId(id);
    
    let trainingSession;
    let recurringTraining;

    // Check if this is a virtual session ID
    const virtualInfo = parseVirtualSessionId(parsedSessionId);
    
    if (virtualInfo) {
      // This is a virtual session - find or create the actual session
      recurringTraining = await prisma.recurringTraining.findUnique({
        where: { id: virtualInfo.recurringTrainingId },
        include: {
          trainingGroups: {
            ...(filterGroupId ? { where: { id: filterGroupId } } : {}),
            include: {
              athleteAssignments: {
                include: {
                  athlete: {
                    include: {
                      user: true,
                    },
                  },
                },
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

      if (!recurringTraining) {
        return NextResponse.json({ error: 'Training nicht gefunden' }, { status: 404 });
      }

      // Check if session already exists for this date
      trainingSession = await prisma.trainingSession.findFirst({
        where: {
          recurringTrainingId: virtualInfo.recurringTrainingId,
          date: virtualInfo.date,
        },
        include: {
          attendanceRecords: true,
          trainerAttendanceRecords: true,
          trainerCancellations: {
            where: { isActive: true },
          },
          cancellations: {
            where: { isActive: true },
            include: {
              athlete: true,
            },
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

      // If no session exists yet, create a virtual response without persisting
      if (!trainingSession) {
        trainingSession = {
          id: parsedSessionId, // Keep virtual ID without group
          date: virtualInfo.date,
          dayOfWeek: recurringTraining.dayOfWeek,
          startTime: recurringTraining.startTime,
          endTime: recurringTraining.endTime,
          isCancelled: false,
          cancellationReason: null,
          notes: null,
          attendanceRecords: [],
          trainerAttendanceRecords: [],
          trainerCancellations: [],
          cancellations: [],
          sessionConfirmations: [],
          sessionGroups: [],
        };
      }
    } else {
      // This is a real session ID
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
                        include: {
                          user: true,
                        },
                      },
                    },
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
          },
          attendanceRecords: true,
          trainerAttendanceRecords: true,
          trainerCancellations: {
            where: { isActive: true },
          },
          cancellations: {
            where: { isActive: true },
            include: {
              athlete: true,
            },
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

      if (!trainingSession) {
        return NextResponse.json({ error: 'Trainingseinheit nicht gefunden' }, { status: 404 });
      }

      recurringTraining = trainingSession.recurringTraining;
    }

    // Build athlete list from groups
    const athleteMap = new Map<string, {
      athleteId: string;
      name: string;
      group: string;
      groupId: string;
    }>();

    // Get the session date for filtering assignments
    const sessionDate = trainingSession.date instanceof Date 
      ? trainingSession.date 
      : new Date(trainingSession.date);

    // Add athletes from groups - only include those assigned BEFORE or ON the session date
    if (recurringTraining) {
      for (const trainingGroup of recurringTraining.trainingGroups) {
        for (const athleteAssignment of trainingGroup.athleteAssignments) {
          const athlete = athleteAssignment.athlete;
          
          // Only include athlete if they were assigned before or on the session date
          const assignedAt = new Date(athleteAssignment.assignedAt);
          assignedAt.setHours(0, 0, 0, 0);
          const sessionDateOnly = new Date(sessionDate);
          sessionDateOnly.setHours(0, 0, 0, 0);
          
          if (assignedAt <= sessionDateOnly) {
            athleteMap.set(athlete.id, {
              athleteId: athlete.id,
              name: `${athlete.user.firstName} ${athlete.user.lastName}`,
              group: trainingGroup.name,
              groupId: trainingGroup.id,
            });
          }
        }
      }
    }

    // Build attendance data
    const attendanceMap = new Map(
      trainingSession.attendanceRecords.map((r: { athleteId: string; status: string; notes?: string | null; isLate?: boolean }) => [r.athleteId, r])
    );

    // Build cancellation data
    const cancellationMap = new Map(
      trainingSession.cancellations.map((c: { athleteId: string; reason: string }) => [c.athleteId, c])
    );

    // Build confirmation data - key is athleteId_groupId or just athleteId for legacy
    const athleteConfirmations = trainingSession.sessionConfirmations.filter(
      (c) => c.athleteId !== null
    );
    const confirmationMap = new Map<string, { confirmed: boolean; declineReason: string | null }>();
    for (const c of athleteConfirmations) {
      if (c.athleteId) {
        // Store with group-specific key if group is specified
        if (c.trainingGroupId) {
          confirmationMap.set(`${c.athleteId}_${c.trainingGroupId}`, { confirmed: c.confirmed, declineReason: c.declineReason });
        }
        // Also store with just athleteId for legacy lookups
        confirmationMap.set(c.athleteId, { confirmed: c.confirmed, declineReason: c.declineReason });
      }
    }

    // Build trainer cancellation data
    const trainerCancellations = 'trainerCancellations' in trainingSession && Array.isArray(trainingSession.trainerCancellations)
      ? trainingSession.trainerCancellations
      : [];
    const trainerCancellationSet = new Set(
      trainerCancellations.map((tc: { trainerId: string }) => tc.trainerId)
    );

    // Build trainer attendance data
    const trainerAttendanceRecords = 'trainerAttendanceRecords' in trainingSession && Array.isArray(trainingSession.trainerAttendanceRecords)
      ? trainingSession.trainerAttendanceRecords
      : [];
    const trainerAttendanceMap = new Map(
      trainerAttendanceRecords.map((r: { trainerId: string; status: string; notes: string | null; isLate?: boolean }) => [r.trainerId, r])
    );

    // Build trainer confirmation data - key is trainerId_groupId or just trainerId for legacy
    const trainerConfirmations = trainingSession.sessionConfirmations.filter(
      (c) => c.trainerId !== null
    );
    const trainerConfirmationMap = new Map<string, { confirmed: boolean; declineReason: string | null }>();
    for (const c of trainerConfirmations) {
      if (c.trainerId) {
        // Store with group-specific key if group is specified
        if (c.trainingGroupId) {
          trainerConfirmationMap.set(`${c.trainerId}_${c.trainingGroupId}`, { confirmed: c.confirmed, declineReason: c.declineReason });
        }
        // Also store with just trainerId for legacy lookups
        trainerConfirmationMap.set(c.trainerId, { confirmed: c.confirmed, declineReason: c.declineReason });
      }
    }

    // Build trainers list from groups - only include those with valid assignment dates
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
      for (const trainingGroup of recurringTraining.trainingGroups) {
        for (const assignment of (trainingGroup as { trainerAssignments?: Array<{ trainerId: string; effectiveFrom?: Date | null; effectiveUntil?: Date | null; trainer: { user: { firstName: string; lastName: string } } }> }).trainerAssignments || []) {
          // Check if trainer assignment is effective for this session date
          const effectiveFrom = assignment.effectiveFrom ? new Date(assignment.effectiveFrom) : null;
          const effectiveUntil = assignment.effectiveUntil ? new Date(assignment.effectiveUntil) : null;
          const sessionDateOnly = new Date(sessionDate);
          sessionDateOnly.setHours(0, 0, 0, 0);
          
          // Skip if assignment has not started yet
          if (effectiveFrom) {
            const effectiveFromDate = new Date(effectiveFrom);
            effectiveFromDate.setHours(0, 0, 0, 0);
            if (effectiveFromDate > sessionDateOnly) continue;
          }
          
          // Skip if assignment has ended
          if (effectiveUntil) {
            const effectiveUntilDate = new Date(effectiveUntil);
            effectiveUntilDate.setHours(0, 0, 0, 0);
            if (effectiveUntilDate < sessionDateOnly) continue;
          }
          
          if (!trainerMap.has(assignment.trainerId)) {
            const attendance = trainerAttendanceMap.get(assignment.trainerId) as { status?: string; notes?: string; isLate?: boolean } | undefined;
            // Try group-specific confirmation first, then fall back to trainer-only
            const confirmation = (
              trainerConfirmationMap.get(`${assignment.trainerId}_${trainingGroup.id}`) ||
              trainerConfirmationMap.get(assignment.trainerId)
            ) as { confirmed?: boolean; declineReason?: string | null } | undefined;
            trainerMap.set(assignment.trainerId, {
              id: assignment.trainerId,
              name: `${assignment.trainer.user.firstName} ${assignment.trainer.user.lastName}`,
              cancelled: trainerCancellationSet.has(assignment.trainerId),
              confirmed: confirmation?.confirmed ?? null,
              declineReason: confirmation?.declineReason,
              attendanceStatus: attendance?.status || null,
              attendanceNote: attendance?.notes,
              isLate: attendance?.isLate,
            });
          }
        }
      }
    }
    const trainers = Array.from(trainerMap.values());

    const athletes = Array.from(athleteMap.values()).map((athlete) => {
      const attendance = attendanceMap.get(athlete.athleteId) as { status?: string; notes?: string; isLate?: boolean } | undefined;
      const cancellation = cancellationMap.get(athlete.athleteId) as { reason?: string } | undefined;
      // Try group-specific confirmation first, then fall back to athlete-only
      const confirmation = (
        confirmationMap.get(`${athlete.athleteId}_${athlete.groupId}`) || 
        confirmationMap.get(athlete.athleteId)
      ) as { confirmed?: boolean; declineReason?: string | null } | undefined;
      
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
        confirmed: confirmation?.confirmed ?? null,
        declineReason: confirmation?.declineReason || undefined,
      };
    });

    // Sort by group and name
    athletes.sort((a, b) => {
      if (a.group !== b.group) return a.group.localeCompare(b.group);
      return a.name.localeCompare(b.name);
    });

    // Get the group name if filtering by group
    const groupName = filterGroupId && recurringTraining?.trainingGroups[0]?.name;

    // Get group-specific equipment if filtering by group
    const sessionGroups = 'sessionGroups' in trainingSession 
      ? (trainingSession.sessionGroups as Array<{ trainingGroupId: string; equipment: string | null }>)
      : [];
    const groupEquipment = filterGroupId 
      ? sessionGroups.find(sg => sg.trainingGroupId === filterGroupId)?.equipment || null
      : null;

    // Check if current trainer is assigned to this group
    const isAdmin = session.user.activeRole === 'ADMIN';
    const trainerProfileId = session.user.trainerProfileId;
    let isOwnGroup = isAdmin; // Admins can always edit
    
    if (!isAdmin && trainerProfileId && filterGroupId) {
      // Check if trainer is assigned to this specific group
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
      // For session without group filter, check if trainer is in any group
      const trainerAssignments = await prisma.recurringTrainingTrainerAssignment.findMany({
        where: { trainerId: trainerProfileId },
        select: { trainingGroupId: true },
      });
      const ownGroupIds = new Set(trainerAssignments.map(a => a.trainingGroupId));
      isOwnGroup = recurringTraining?.trainingGroups.some((g: { id: string }) => ownGroupIds.has(g.id)) || false;
    }

    const data = {
      id: id, // Return the full ID including group
      sessionId: trainingSession.id,
      recurringTrainingId: virtualInfo?.recurringTrainingId || (trainingSession as { recurringTrainingId?: string }).recurringTrainingId,
      trainingGroupId: filterGroupId,
      groupName: groupName || null,
      date: trainingSession.date instanceof Date ? trainingSession.date.toISOString() : new Date(trainingSession.date).toISOString(),
      name: recurringTraining?.name || 'Training',
      startTime: recurringTraining?.startTime || trainingSession.startTime || '',
      endTime: recurringTraining?.endTime || trainingSession.endTime || '',
      groups: recurringTraining?.trainingGroups.map((g: { id: string; name: string }) => ({ id: g.id, name: g.name })) || [],
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

// PATCH - Update session group (equipment, notes, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Parse group ID if present and extract session ID and group ID
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

    // Check if this is a virtual session ID
    const virtualInfo = parseVirtualSessionId(parsedSessionId);
    
    let trainingSession;
    let sessionGroup;
    
    if (virtualInfo) {
      // For virtual sessions, we need to create a real session first
      const recurringTraining = await prisma.recurringTraining.findUnique({
        where: { id: virtualInfo.recurringTrainingId },
        include: {
          trainingGroups: {
            where: { id: groupId },
          },
        },
      });

      if (!recurringTraining) {
        return NextResponse.json({ error: 'Training nicht gefunden' }, { status: 404 });
      }

      if (recurringTraining.trainingGroups.length === 0) {
        return NextResponse.json({ error: 'Gruppe nicht gefunden' }, { status: 404 });
      }

      // Check if session already exists
      trainingSession = await prisma.trainingSession.findFirst({
        where: {
          recurringTrainingId: virtualInfo.recurringTrainingId,
          date: virtualInfo.date,
        },
      });

      if (!trainingSession) {
        // Create the session
        trainingSession = await prisma.trainingSession.create({
          data: {
            recurringTrainingId: virtualInfo.recurringTrainingId,
            date: virtualInfo.date,
            dayOfWeek: recurringTraining.dayOfWeek,
            startTime: recurringTraining.startTime,
            endTime: recurringTraining.endTime,
          },
        });
      }

      // Now create or update the SessionGroup with equipment
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
      // Real session ID - find or create the SessionGroup and update
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
