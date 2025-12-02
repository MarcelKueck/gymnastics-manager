import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseVirtualSessionId } from '@/lib/sessions/virtual-sessions';

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
    
    let trainingSession;
    let recurringTraining;

    // Check if this is a virtual session ID
    const virtualInfo = parseVirtualSessionId(id);
    
    if (virtualInfo) {
      // This is a virtual session - find or create the actual session
      recurringTraining = await prisma.recurringTraining.findUnique({
        where: { id: virtualInfo.recurringTrainingId },
        include: {
          trainingGroups: {
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
            include: {
              athlete: true,
            },
          },
        },
      });

      // If no session exists yet, create a virtual response without persisting
      if (!trainingSession) {
        trainingSession = {
          id: id, // Keep virtual ID
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
        };
      }
    } else {
      // This is a real session ID
      trainingSession = await prisma.trainingSession.findUnique({
        where: { id },
        include: {
          recurringTraining: {
            include: {
              trainingGroups: {
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
            include: {
              athlete: true,
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
    }>();

    // Add athletes from groups
    if (recurringTraining) {
      for (const trainingGroup of recurringTraining.trainingGroups) {
        for (const athleteAssignment of trainingGroup.athleteAssignments) {
          const athlete = athleteAssignment.athlete;
          athleteMap.set(athlete.id, {
            athleteId: athlete.id,
            name: `${athlete.user.firstName} ${athlete.user.lastName}`,
            group: trainingGroup.name,
          });
        }
      }
    }

    // Build attendance data
    const attendanceMap = new Map(
      trainingSession.attendanceRecords.map((r: { athleteId: string }) => [r.athleteId, r])
    );

    // Build cancellation data
    const cancellationMap = new Map(
      trainingSession.cancellations.map((c: { athleteId: string }) => [c.athleteId, c])
    );

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
      trainerAttendanceRecords.map((r: { trainerId: string; status: string; notes: string | null }) => [r.trainerId, r])
    );

    // Build trainers list from groups
    const trainerMap = new Map<string, { id: string; name: string; cancelled: boolean; attendanceStatus: string | null; attendanceNote?: string }>();
    if (recurringTraining) {
      for (const trainingGroup of recurringTraining.trainingGroups) {
        for (const assignment of (trainingGroup as { trainerAssignments?: Array<{ trainerId: string; trainer: { user: { firstName: string; lastName: string } } }> }).trainerAssignments || []) {
          if (!trainerMap.has(assignment.trainerId)) {
            const attendance = trainerAttendanceMap.get(assignment.trainerId) as { status?: string; notes?: string } | undefined;
            trainerMap.set(assignment.trainerId, {
              id: assignment.trainerId,
              name: `${assignment.trainer.user.firstName} ${assignment.trainer.user.lastName}`,
              cancelled: trainerCancellationSet.has(assignment.trainerId),
              attendanceStatus: attendance?.status || null,
              attendanceNote: attendance?.notes,
            });
          }
        }
      }
    }
    const trainers = Array.from(trainerMap.values());

    const athletes = Array.from(athleteMap.values()).map((athlete) => {
      const attendance = attendanceMap.get(athlete.athleteId) as { status?: string; notes?: string } | undefined;
      const cancellation = cancellationMap.get(athlete.athleteId) as { reason?: string } | undefined;
      
      return {
        id: athlete.athleteId,
        athleteId: athlete.athleteId,
        name: athlete.name,
        group: athlete.group,
        status: attendance?.status || null,
        note: attendance?.notes || undefined,
        hasCancellation: !!cancellation,
        cancellationNote: cancellation?.reason || undefined,
      };
    });

    // Sort by group and name
    athletes.sort((a, b) => {
      if (a.group !== b.group) return a.group.localeCompare(b.group);
      return a.name.localeCompare(b.name);
    });

    const data = {
      id: trainingSession.id,
      recurringTrainingId: virtualInfo?.recurringTrainingId || (trainingSession as { recurringTrainingId?: string }).recurringTrainingId,
      date: trainingSession.date instanceof Date ? trainingSession.date.toISOString() : new Date(trainingSession.date).toISOString(),
      name: recurringTraining?.name || 'Training',
      startTime: recurringTraining?.startTime || trainingSession.startTime || '',
      endTime: recurringTraining?.endTime || trainingSession.endTime || '',
      groups: recurringTraining?.trainingGroups.map((g: { name: string }) => g.name) || [],
      isCancelled: trainingSession.isCancelled,
      isVirtual: id.startsWith('virtual_'),
      equipment: (trainingSession as { equipment?: string | null }).equipment || null,
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

// PATCH - Update session details (equipment)
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

    let sessionId = id;

    // Handle virtual session IDs - create the actual session first
    const virtualInfo = parseVirtualSessionId(id);
    if (virtualInfo) {
      // Check if session already exists
      const existingSession = await prisma.trainingSession.findFirst({
        where: {
          recurringTrainingId: virtualInfo.recurringTrainingId,
          date: virtualInfo.date,
        },
      });

      if (existingSession) {
        sessionId = existingSession.id;
      } else {
        // Get recurring training details
        const recurringTraining = await prisma.recurringTraining.findUnique({
          where: { id: virtualInfo.recurringTrainingId },
        });

        if (!recurringTraining) {
          return NextResponse.json({ error: 'Training nicht gefunden' }, { status: 404 });
        }

        // Create the session
        const newSession = await prisma.trainingSession.create({
          data: {
            recurringTrainingId: virtualInfo.recurringTrainingId,
            date: virtualInfo.date,
            dayOfWeek: recurringTraining.dayOfWeek,
            startTime: recurringTraining.startTime,
            endTime: recurringTraining.endTime,
            equipment: equipment || null,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Geräte gespeichert',
          data: { id: newSession.id, equipment: newSession.equipment },
        });
      }
    }

    // Update existing session
    const updatedSession = await prisma.trainingSession.update({
      where: { id: sessionId },
      data: {
        equipment: equipment || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Geräte gespeichert',
      data: { id: updatedSession.id, equipment: updatedSession.equipment },
    });
  } catch (error) {
    console.error('Session update API error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Geräte' },
      { status: 500 }
    );
  }
}
