// src/app/api/trainer/athletes/[id]/config/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendScheduleChangeEmail } from '@/lib/email';

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
    const {
      trainingDays,
      trainingHours,
      group,
      youthCategory,
      isCompetition,
    } = body;

    // Validate required fields
    if (!trainingDays || !trainingHours || !group || !youthCategory) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get athlete and current config
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      include: {
        groupAssignments: {
          where: { isActive: true },
        },
      },
    });

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    // Store old config for comparison (from current group assignments)
    const currentAssignments = athlete.groupAssignments || [];
    const oldTrainingDays = [...new Set(currentAssignments.map(a => a.trainingDay))];
    
    // Convert hourNumber to training hours format (first/second)
    const hourNumberToHour = (num: number) => num === 1 ? 'first' : 'second';
    const oldTrainingHours = [...new Set(currentAssignments.map(a => hourNumberToHour(a.hourNumber)))];
    const oldGroup = currentAssignments.length > 0 ? currentAssignments[0].groupNumber : group;
    
    const oldConfig = {
      trainingDays: oldTrainingDays,
      trainingHours: oldTrainingHours,
      group: oldGroup,
      youthCategory: athlete.youthCategory || youthCategory,
      isCompetition: athlete.competitionParticipation || false,
    };

    // Update athlete configuration
    const updatedAthlete = await prisma.athlete.update({
      where: { id: athleteId },
      data: {
        youthCategory,
        competitionParticipation: Boolean(isCompetition),
        configuredAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        performedBy: session.user.id,
        action: 'update',
        entityType: 'athlete',
        entityId: updatedAthlete.id,
        changes: {
          athleteId,
          athleteName: `${athlete.firstName} ${athlete.lastName}`,
          oldConfig,
          newConfig: {
            trainingDays,
            trainingHours,
            group,
            youthCategory,
            isCompetition,
          },
        },
        reason: 'Training configuration updated by trainer',
      },
    });

    // Send email notification about configuration update
    try {
      await sendScheduleChangeEmail({
        athleteEmail: athlete.email,
        guardianEmail: athlete.guardianEmail || undefined,
        athleteName: `${athlete.firstName} ${athlete.lastName}`,
        oldSchedule: {
          trainingDays: oldConfig.trainingDays,
          trainingHours: oldConfig.trainingHours,
          group: oldConfig.group,
        },
        newSchedule: {
          trainingDays,
          trainingHours,
          group: Number(group),
        },
      });
      console.log('✅ Configuration change email sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send configuration change email:', emailError);
    }

    return NextResponse.json({
      message: 'Training configuration updated successfully',
      athlete: updatedAthlete,
    });
  } catch (error) {
    console.error('Error updating training configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update training configuration' },
      { status: 500 }
    );
  }
}