import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: athleteId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { youthCategory, competitionParticipation, hasDtbId, groupIds } = body;

    // Validate required fields
    if (!youthCategory || !Array.isArray(groupIds)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (groupIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one training group must be selected' },
        { status: 400 }
      );
    }

    // Get athlete with current assignments
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      include: {
        recurringTrainingAssignments: {
          select: {
            id: true,
            trainingGroupId: true,
            trainingGroup: {
              select: {
                id: true,
                name: true,
                recurringTraining: {
                  select: {
                    name: true,
                    dayOfWeek: true,
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

    // Verify all group IDs exist
    const groups = await prisma.trainingGroup.findMany({
      where: {
        id: { in: groupIds },
      },
      include: {
        recurringTraining: {
          select: {
            name: true,
            dayOfWeek: true,
            isActive: true,
          },
        },
      },
    });

    if (groups.length !== groupIds.length) {
      return NextResponse.json({ error: 'Some training groups not found' }, { status: 404 });
    }

    // Check for inactive trainings
    const inactiveTrainings = groups.filter((g) => !g.recurringTraining.isActive);
    if (inactiveTrainings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot assign to inactive trainings' },
        { status: 400 }
      );
    }

    // Get current group IDs
    const currentGroupIds = athlete.recurringTrainingAssignments.map((a) => a.trainingGroupId);

    // Determine which groups to add and remove
    const groupsToAdd = groupIds.filter((id: string) => !currentGroupIds.includes(id));
    const groupsToRemove = currentGroupIds.filter((id) => !groupIds.includes(id));

    // Perform updates in a transaction
    await prisma.$transaction(async (tx) => {
      // Update athlete configuration
      await tx.athlete.update({
        where: { id: athleteId },
        data: {
          youthCategory,
          competitionParticipation: Boolean(competitionParticipation),
          hasDtbId: Boolean(hasDtbId),
          configuredAt: new Date(),
        },
      });

      // Remove old group assignments
      if (groupsToRemove.length > 0) {
        await tx.recurringTrainingAthleteAssignment.deleteMany({
          where: {
            athleteId,
            trainingGroupId: { in: groupsToRemove },
          },
        });
      }

      // Add new group assignments
      if (groupsToAdd.length > 0) {
        await tx.recurringTrainingAthleteAssignment.createMany({
          data: groupsToAdd.map((groupId: string) => ({
            trainingGroupId: groupId,
            athleteId,
            assignedBy: session.user.id,
            assignedAt: new Date(),
          })),
          skipDuplicates: true,
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          performedBy: session.user.id,
          action: 'update',
          entityType: 'athlete',
          entityId: athleteId,
          changes: {
            athleteId,
            athleteName: `${athlete.firstName} ${athlete.lastName}`,
            youthCategory: {
              old: athlete.youthCategory,
              new: youthCategory,
            },
            competitionParticipation: {
              old: athlete.competitionParticipation,
              new: competitionParticipation,
            },
            hasDtbId: {
              old: athlete.hasDtbId,
              new: hasDtbId,
            },
            groupAssignments: {
              added: groupsToAdd,
              removed: groupsToRemove,
            },
          },
          reason: 'Training configuration updated by trainer',
        },
      });
    });

    return NextResponse.json({
      message: 'Training configuration updated successfully',
      groupsAdded: groupsToAdd.length,
      groupsRemoved: groupsToRemove.length,
    });
  } catch (error) {
    console.error('Error updating training configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update training configuration' },
      { status: 500 }
    );
  }
}
