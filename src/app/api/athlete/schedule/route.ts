import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
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
                    isActive: true,
                    dayOfWeek: true,
                    name: true,
                    startTime: true,
                    endTime: true,
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

    if (!athlete.isApproved) {
      return NextResponse.json({ error: 'Account pending approval' }, { status: 403 });
    }

    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    const includeAll = searchParams.get('includeAll') === 'true';

    const now = new Date();
    
    // Get all training group IDs and their recurring training IDs
    const groupAssignments = athlete.recurringTrainingAssignments
      .filter(assignment => assignment.trainingGroup.recurringTraining?.isActive)
      .map(assignment => ({
        trainingGroupId: assignment.trainingGroup.id,
        trainingGroupName: assignment.trainingGroup.name,
        recurringTrainingId: assignment.trainingGroup.recurringTraining.id,
        recurringTrainingName: assignment.trainingGroup.recurringTraining.name,
      }));

    if (groupAssignments.length === 0) {
      return NextResponse.json({ sessions: [] });
    }

    // Get unique recurring training IDs
    const recurringTrainingIds = [...new Set(groupAssignments.map(a => a.recurringTrainingId))];

    const whereCondition = {
      recurringTrainingId: {
        in: recurringTrainingIds,
      },
      isCancelled: false,
      ...(includeAll ? {} : { date: { gte: now } }),
    };

    // Get training sessions with their groups
    const sessions = await prisma.trainingSession.findMany({
      where: whereCondition,
      orderBy: { date: 'asc' },
      take: limit,
      include: {
        recurringTraining: {
          select: {
            id: true,
            name: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
          },
        },
        groups: {
          include: {
            trainingGroup: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            sessionAthleteAssignments: {
              where: {
                athleteId,
              },
              select: {
                id: true,
                reason: true,
                movedAt: true,
              },
            },
          },
        },
        cancellations: {
          where: {
            athleteId,
            isActive: true,
          },
          select: {
            id: true,
            reason: true,
            cancelledAt: true,
          },
        },
      },
    });

    // Filter and enrich sessions to only include athlete's groups
    const enrichedSessions = sessions.map(session => {
      // Find which group(s) this athlete is in for this session
      const athleteGroups = groupAssignments
        .filter(ga => ga.recurringTrainingId === session.recurringTrainingId)
        .map(ga => {
          const sessionGroup = session.groups.find(sg => sg.trainingGroup.id === ga.trainingGroupId);
          
          // Check if athlete was temporarily reassigned to a different group
          const tempReassignment = session.groups.find(sg => 
            sg.sessionAthleteAssignments.length > 0
          );

          return {
            trainingGroupId: ga.trainingGroupId,
            trainingGroupName: tempReassignment 
              ? tempReassignment.trainingGroup.name 
              : ga.trainingGroupName,
            exercises: sessionGroup?.exercises || null,
            notes: sessionGroup?.notes || null,
            isTemporarilyReassigned: !!tempReassignment,
            reassignmentReason: tempReassignment?.sessionAthleteAssignments[0]?.reason || null,
          };
        });

      return {
        ...session,
        athleteGroups,
      };
    });

    return NextResponse.json({ sessions: enrichedSessions });
  } catch (error: unknown) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}