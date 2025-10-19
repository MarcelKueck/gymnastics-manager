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

    if (!session || session.user.role !== 'TRAINER') {
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

    // Get or create all sessions for this date (all combinations of hours and groups)
    const sessions = [];
    for (const hour of [1, 2]) {
      for (const group of [1, 2, 3]) {
        let trainingSession = await prisma.trainingSession.findFirst({
          where: {
            date: {
              gte: startOfDay,
              lt: endOfDay,
            },
            dayOfWeek,
            hourNumber: hour,
            groupNumber: group,
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
          },
        });

        if (!trainingSession) {
          trainingSession = await prisma.trainingSession.create({
            data: {
              date: startOfDay,
              dayOfWeek,
              hourNumber: hour,
              groupNumber: group,
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
            },
          });
        }

        sessions.push(trainingSession);
      }
    }

    // Get all approved athletes
    const athletes = await prisma.athlete.findMany({
      where: {
        isApproved: true,
      },
      include: {
        groupAssignments: {
          where: {
            isActive: true,
            trainingDay: dayOfWeek,
          },
        },
      },
      orderBy: {
        lastName: 'asc',
      },
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

    return NextResponse.json({
      sessions,
      scheduledAthletes: athletes,
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

    if (!session || session.user.role !== 'TRAINER') {
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
      const { sessionId, attendance, equipment1, equipment2, notes, trainerId } = update;

      // Update session details
      await prisma.trainingSession.update({
        where: { id: sessionId },
        data: {
          equipment1,
          equipment2,
          notes,
        },
      });

      // Update trainer assignment
      if (trainerId) {
        // Remove existing assignments
        await prisma.trainerSessionAssignment.deleteMany({
          where: { sessionId },
        });

        // Create new assignment
        await prisma.trainerSessionAssignment.create({
          data: {
            sessionId,
            trainerId,
          },
        });
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