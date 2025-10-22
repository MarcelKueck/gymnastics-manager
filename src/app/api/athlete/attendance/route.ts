import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ATHLETE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const athleteId = session.user.id;

    // Get athlete with recurring training group assignments
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      include: {
        recurringTrainingAssignments: {
          include: {
            trainingGroup: {
              include: {
                recurringTraining: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    // Create a map of recurringTrainingId -> groupName
    const groupMap = new Map(
      athlete.recurringTrainingAssignments.map((assignment) => [
        assignment.trainingGroup.recurringTraining.id,
        assignment.trainingGroup.name,
      ])
    );

    // Get all attendance records
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { athleteId },
      include: {
        trainingSession: {
          select: {
            id: true,
            date: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            recurringTrainingId: true,
            recurringTraining: {
              select: {
                name: true,
              },
            },
            groups: {
              include: {
                trainingGroup: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                sessionAthleteAssignments: {
                  where: {
                    athleteId,
                  },
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { trainingSession: { date: 'desc' } },
    });

    // Calculate statistics
    const totalSessions = attendanceRecords.length;
    const presentSessions = attendanceRecords.filter(
      (record) => record.status === 'PRESENT'
    ).length;
    const excusedAbsences = attendanceRecords.filter(
      (record) => record.status === 'ABSENT_EXCUSED'
    ).length;
    const unexcusedAbsences = attendanceRecords.filter(
      (record) => record.status === 'ABSENT_UNEXCUSED'
    ).length;

    const attendancePercentage =
      totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;
    const excusedPercentage =
      totalSessions > 0 ? Math.round((excusedAbsences / totalSessions) * 100) : 0;

    // Get cancellations to show reasons
    const cancellations = await prisma.cancellation.findMany({
      where: { 
        athleteId,
        isActive: true,
      },
      select: {
        trainingSessionId: true,
        reason: true,
      },
    });

    // Map cancellations by session ID
    const cancellationMap = new Map(
      cancellations.map((c) => [c.trainingSessionId, c.reason])
    );

    // Attach cancellation reasons and group info to attendance records
    const recordsWithReasons = attendanceRecords.map((record) => {
      // Find which group this athlete was in for this session
      let groupName = null;
      
      if (record.trainingSession.recurringTrainingId) {
        // Check if athlete was temporarily reassigned
        const tempGroup = record.trainingSession.groups.find(
          (g) => g.sessionAthleteAssignments.length > 0
        );
        
        if (tempGroup) {
          groupName = tempGroup.trainingGroup.name;
        } else {
          // Use default group assignment
          groupName = groupMap.get(record.trainingSession.recurringTrainingId) || null;
        }
      }

      return {
        ...record,
        cancellationReason: cancellationMap.get(record.trainingSessionId) || null,
        trainingSession: {
          ...record.trainingSession,
          groupName,
          trainingName: record.trainingSession.recurringTraining?.name || null,
        },
      };
    });

    return NextResponse.json({
      records: recordsWithReasons,
      stats: {
        totalSessions,
        presentSessions,
        excusedAbsences,
        unexcusedAbsences,
        attendancePercentage,
        excusedPercentage,
      },
    });
  } catch (error) {
    console.error('Attendance API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}