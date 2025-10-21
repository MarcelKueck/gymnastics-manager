// src/app/api/trainer/sessions/[date]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAndSendAbsenceAlert } from '@/lib/absenceAlert';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date: dateStr } = await params;
    const date = new Date(dateStr);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Determine day of week
    const dayOfWeekMap: Record<number, 'MONDAY' | 'THURSDAY' | 'FRIDAY'> = {
      1: 'MONDAY',
      4: 'THURSDAY',
      5: 'FRIDAY',
    };
    const dayOfWeek = dayOfWeekMap[date.getDay()];

    if (!dayOfWeek) {
      return NextResponse.json({ 
        sessions: [],
        scheduledAthletes: [],
        cancellations: [],
        trainers: []
      });
    }

    // Get all sessions for this date from the database (generated from recurring trainings)
    const sessions = await prisma.trainingSession.findMany({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
        isCancelled: false, // Only show non-cancelled sessions
      },
      include: {
        attendanceRecords: {
          include: {
            athlete: true,
          },
        },
        trainerAssignments: {
          include: {
            trainer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        recurringTraining: {
          include: {
            athleteAssignments: {
              include: {
                athlete: true,
              },
            },
          },
        },
      },
      orderBy: [
        { startTime: 'asc' },
        { groupNumber: 'asc' },
      ],
    });

    // Get cancellations for this date
    const cancellations = await prisma.cancellation.findMany({
      where: {
        trainingSession: {
          date: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
        isActive: true,
      },
      include: {
        athlete: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        cancelledAt: 'desc',
      },
    });

    // Get all trainers
    const trainers = await prisma.trainer.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
      orderBy: {
        lastName: 'asc',
      },
    });

    // Organize athletes by their recurring training assignments
    const athletesBySession: Record<string, any[]> = {};
    
    sessions.forEach((session) => {
      if (session.recurringTraining) {
        athletesBySession[session.id] = session.recurringTraining.athleteAssignments
          .map((assignment) => assignment.athlete)
          .sort((a, b) => a.lastName.localeCompare(b.lastName));
      } else {
        athletesBySession[session.id] = [];
      }
    });

    return NextResponse.json({
      sessions,
      athletesBySession,
      cancellations,
      trainers,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date: dateParam } = await params;
    const body = await request.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    // Process each session update
    for (const update of updates) {
      const { sessionId, attendance, equipment1, equipment2, notes, trainerIds } = update;

      // Update session details
      await prisma.trainingSession.update({
        where: { id: sessionId },
        data: {
          equipment1,
          equipment2,
          notes,
        },
      });

      // Update trainer assignments (support up to 2 trainers)
      if (trainerIds && Array.isArray(trainerIds)) {
        // Remove existing assignments
        await prisma.trainerSessionAssignment.deleteMany({
          where: { sessionId },
        });

        // Validate that we have at least 1 and at most 2 trainers
        const validTrainerIds = trainerIds.filter(id => id && id.trim() !== '').slice(0, 2);
        
        if (validTrainerIds.length < 1) {
          // If no valid trainers, we'll skip creating assignments
          // The session can exist without trainer assignments
        } else {
          // Create new assignments for each trainer
          for (const trainerId of validTrainerIds) {
            await prisma.trainerSessionAssignment.create({
              data: {
                sessionId,
                trainerId,
              },
            });
          }
        }
      }

      // Update attendance records
      if (attendance && Array.isArray(attendance)) {
        for (const record of attendance) {
          const { athleteId, status } = record;

          const existingAttendance = await prisma.attendanceRecord.findFirst({
            where: {
              trainingSessionId: sessionId,
              athleteId,
            },
          });

          if (existingAttendance) {
            // Check if status changed for audit
            const oldStatus = existingAttendance.status;
            
            await prisma.attendanceRecord.update({
              where: { id: existingAttendance.id },
              data: {
                status,
                markedBy: session.user.id,
                markedAt: new Date(),
                lastModifiedBy: oldStatus !== status ? session.user.id : existingAttendance.lastModifiedBy,
                lastModifiedAt: oldStatus !== status ? new Date() : existingAttendance.lastModifiedAt,
              },
            });

            // Create audit log if status changed
            if (oldStatus !== status) {
              await prisma.auditLog.create({
                data: {
                  performedBy: session.user.id,
                  action: 'update',
                  entityType: 'attendance',
                  entityId: existingAttendance.id,
                  changes: {
                    sessionId,
                    athleteId,
                    oldStatus,
                    newStatus: status,
                    date: dateParam,
                  },
                },
              });
            }
          } else {
            const newRecord = await prisma.attendanceRecord.create({
              data: {
                trainingSessionId: sessionId,
                athleteId,
                status,
                markedBy: session.user.id,
              },
            });

            // Create audit log
            await prisma.auditLog.create({
              data: {
                performedBy: session.user.id,
                action: 'create',
                entityType: 'attendance',
                entityId: newRecord.id,
                changes: {
                  sessionId,
                  athleteId,
                  status,
                  date: dateParam,
                },
              },
            });
          }

          // Check for unexcused absence alerts
          if (status === 'ABSENT_UNEXCUSED') {
            checkAndSendAbsenceAlert(athleteId).catch((error: unknown) => {
              console.error('Error in absence alert check:', error);
            });
          }
        }
      }
    }

    return NextResponse.json({
      message: 'Sessions updated successfully',
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}