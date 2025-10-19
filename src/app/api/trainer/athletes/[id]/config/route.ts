// src/app/api/trainer/athletes/[id]/config/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendScheduleChangeEmail } from '@/lib/email';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const athleteId = params.id;
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
    const athlete = await prisma.user.findUnique({
      where: { id: athleteId },
      include: {
        trainingConfig: true,
      },
    });

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    if (!athlete.trainingConfig) {
      return NextResponse.json(
        { error: 'No training configuration found' },
        { status: 404 }
      );
    }

    // Store old config for comparison
    const oldConfig = {
      trainingDays: athlete.trainingConfig.trainingDays,
      trainingHours: athlete.trainingConfig.trainingHours,
      group: athlete.trainingConfig.group,
    };

    // Update training configuration
    const updatedConfig = await prisma.trainingConfig.update({
      where: { userId: athleteId },
      data: {
        trainingDays,
        trainingHours,
        group: Number(group),
        youthCategory,
        isCompetition: Boolean(isCompetition),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_TRAINING_CONFIG',
        entityType: 'TRAINING_CONFIG',
        entityId: updatedConfig.id,
        details: {
          athleteId,
          athleteName: athlete.name,
          oldConfig,
          newConfig: {
            trainingDays,
            trainingHours,
            group,
            youthCategory,
            isCompetition,
          },
        },
      },
    });

    // Check if schedule actually changed
    const scheduleChanged =
      JSON.stringify(oldConfig.trainingDays.sort()) !== JSON.stringify(trainingDays.sort()) ||
      JSON.stringify(oldConfig.trainingHours.sort()) !== JSON.stringify(trainingHours.sort()) ||
      oldConfig.group !== Number(group);

    // Send schedule change email if schedule changed
    if (scheduleChanged) {
      try {
        await sendScheduleChangeEmail({
          athleteEmail: athlete.email,
          guardianEmail: athlete.guardianEmail,
          athleteName: athlete.name,
          oldSchedule: oldConfig,
          newSchedule: {
            trainingDays,
            trainingHours,
            group: Number(group),
          },
        });
        console.log('✅ Schedule change email sent successfully');
      } catch (emailError) {
        console.error('❌ Failed to send schedule change email:', emailError);
      }
    }

    return NextResponse.json({
      message: 'Training configuration updated successfully',
      config: updatedConfig,
    });
  } catch (error) {
    console.error('Error updating training configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update training configuration' },
      { status: 500 }
    );
  }
}