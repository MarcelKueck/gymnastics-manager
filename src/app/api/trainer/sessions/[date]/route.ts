import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dateParam = params.date;
    const date = new Date(dateParam);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // Get all sessions for this date
    const sessions = await prisma.trainingSession.findMany({
      where: {
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      include: {
        attendanceRecords: {
          include: {
            athlete: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: [
        { hourNumber: 'asc' },
        { groupNumber: 'asc' },
      ],
    });

    if (sessions.length === 0) {
      return NextResponse.json({ error: 'No sessions found for this date' }, { status: 404 });
    }

    // For each session, get athletes assigned to that group/hour/day
    const sessionsWithAthletes = await Promise.all(
      sessions.map(async (session) => {
        // Get athletes assigned to this specific group/hour/day combination
        const assignments = await prisma.athleteGroupAssignment.findMany({
          where: {
            trainingDay: session.dayOfWeek,
            hourNumber: session.hourNumber,
            groupNumber: session.groupNumber,
            isActive: true,
            athlete: {
              isApproved: true,
            },
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
        });

        // Get cancellations for this session
        const cancellations = await prisma.cancellation.findMany({
          where: {
            trainingSessionId: session.id,
            isActive: true,
          },
          select: {
            athleteId: true,
            reason: true,
          },
        });

        const cancellationMap = new Map(
          cancellations.map((c) => [c.athleteId, c.reason])
        );

        // Build athlete list with attendance status
        const athletes = assignments.map((assignment) => {
          const athleteId = assignment.athlete.id;
          const attendanceRecord = session.attendanceRecords.find(
            (r) => r.athlete.id === athleteId
          );
          const cancelled = cancellationMap.has(athleteId);

          return {
            id: athleteId,
            firstName: assignment.athlete.firstName,
            lastName: assignment.athlete.lastName,
            status: attendanceRecord?.status || null,
            cancelled,
            cancellationReason: cancelled ? cancellationMap.get(athleteId) : undefined,
          };
        });

        return {
          sessionId: session.id,
          groupNumber: session.groupNumber,
          hourNumber: session.hourNumber,
          equipment1: session.equipment1 || '',
          equipment2: session.equipment2 || '',
          notes: session.notes || '',
          athletes: athletes.sort((a, b) => a.lastName.localeCompare(b.lastName)),
        };
      })
    );

    return NextResponse.json({ sessions: sessionsWithAthletes });
  } catch (error) {
    console.error('Get session detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { updates } = body as {
      updates: Array<{
        sessionId: string;
        equipment1: string;
        equipment2: string;
        notes: string;
        attendance: Array<{
          athleteId: string;
          status: 'PRESENT' | 'ABSENT_UNEXCUSED' | 'ABSENT_EXCUSED';
        }>;
      }>;
    };

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid updates data' }, { status: 400 });
    }

    const trainerId = session.user.id;

    // Process all updates in a transaction
    await prisma.$transaction(async (tx) => {
      for (const update of updates) {
        // Update session details (equipment, notes)
        await tx.trainingSession.update({
          where: { id: update.sessionId },
          data: {
            equipment1: update.equipment1,
            equipment2: update.equipment2,
            notes: update.notes,
          },
        });

        // Update or create attendance records
        for (const attendance of update.attendance) {
          // Check if attendance record exists
          const existing = await tx.attendanceRecord.findUnique({
            where: {
              athleteId_trainingSessionId: {
                athleteId: attendance.athleteId,
                trainingSessionId: update.sessionId,
              },
            },
          });

          if (existing) {
            // Update existing record
            const oldStatus = existing.status;
            if (oldStatus !== attendance.status) {
              await tx.attendanceRecord.update({
                where: {
                  athleteId_trainingSessionId: {
                    athleteId: attendance.athleteId,
                    trainingSessionId: update.sessionId,
                  },
                },
                data: {
                  status: attendance.status,
                  lastModifiedBy: trainerId,
                  lastModifiedAt: new Date(),
                },
              });

              // Create audit log
              await tx.auditLog.create({
                data: {
                  entityType: 'attendance',
                  entityId: existing.id,
                  action: 'update',
                  changes: {
                    oldStatus,
                    newStatus: attendance.status,
                    athleteId: attendance.athleteId,
                    sessionId: update.sessionId,
                  },
                  performedBy: trainerId,
                  reason: 'Attendance updated by trainer',
                },
              });
            }
          } else {
            // Create new record
            const newRecord = await tx.attendanceRecord.create({
              data: {
                athleteId: attendance.athleteId,
                trainingSessionId: update.sessionId,
                status: attendance.status,
                markedBy: trainerId,
                markedAt: new Date(),
              },
            });

            // Create audit log
            await tx.auditLog.create({
              data: {
                entityType: 'attendance',
                entityId: newRecord.id,
                action: 'create',
                changes: {
                  status: attendance.status,
                  athleteId: attendance.athleteId,
                  sessionId: update.sessionId,
                },
                performedBy: trainerId,
                reason: 'Attendance marked by trainer',
              },
            });
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Attendance saved successfully',
    });
  } catch (error) {
    console.error('Update session error:', error);
    return NextResponse.json(
      { error: 'Failed to save attendance' },
      { status: 500 }
    );
  }
}