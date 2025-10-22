import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
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

    // Get all sessions for this date with their session groups
    const sessions = await prisma.trainingSession.findMany({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
        isCancelled: false,
      },
      include: {
        groups: {
          include: {
            trainingGroup: {
              include: {
                athleteAssignments: {
                  include: {
                    athlete: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        birthDate: true,
                      },
                    },
                  },
                },
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
            sessionAthleteAssignments: {
              include: {
                athlete: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    birthDate: true,
                  },
                },
              },
            },
          },
          orderBy: {
            trainingGroup: {
              sortOrder: 'asc',
            },
          },
        },
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
        recurringTraining: true,
      },
      orderBy: {
        startTime: 'asc',
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

    // Process each session group to organize athletes
    // For each session group, we need to determine:
    // 1. Default athletes (from recurring training group assignments)
    // 2. Temporarily reassigned athletes (from session-specific assignments)
    const processedSessions = sessions.map((session) => ({
      ...session,
      groups: session.groups.map((sessionGroup) => {
        // Get default athletes from recurring training group
        const defaultAthletes = sessionGroup.trainingGroup.athleteAssignments
          .map((assignment) => ({
            ...assignment.athlete,
            isTemporarilyReassigned: false,
          }))
          .sort((a, b) => a.lastName.localeCompare(b.lastName));

        // Get temporarily reassigned athletes for THIS session group
        const tempAthletes = sessionGroup.sessionAthleteAssignments.map((assignment) => ({
          ...assignment.athlete,
          isTemporarilyReassigned: true,
          reassignmentReason: assignment.reason,
          movedAt: assignment.movedAt,
        }));

        // Combine: remove default athletes that were moved elsewhere,
        // add temp athletes that were moved here
        const allAthleteIds = new Set([
          ...defaultAthletes.map((a) => a.id),
          ...tempAthletes.map((a) => a.id),
        ]);

        const athletes = Array.from(allAthleteIds).map((athleteId) => {
          const tempAthlete = tempAthletes.find((a) => a.id === athleteId);
          if (tempAthlete) return tempAthlete;
          return defaultAthletes.find((a) => a.id === athleteId)!;
        });

        return {
          ...sessionGroup,
          athletes: athletes.sort((a, b) => a.lastName.localeCompare(b.lastName)),
        };
      }),
    }));

    return NextResponse.json({
      sessions: processedSessions,
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

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionGroupId, exercises, notes } = body;

    if (!sessionGroupId) {
      return NextResponse.json(
        { error: 'Session group ID is required' },
        { status: 400 }
      );
    }

    // Update the session group with exercises and notes
    const updatedSessionGroup = await prisma.sessionGroup.update({
      where: { id: sessionGroupId },
      data: {
        exercises: exercises || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(updatedSessionGroup);
  } catch (error) {
    console.error('Error updating session group:', error);
    return NextResponse.json(
      { error: 'Failed to update session group' },
      { status: 500 }
    );
  }
}