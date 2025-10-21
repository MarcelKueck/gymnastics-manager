// src/app/api/trainer/athletes/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendAthleteApprovalEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only admins can approve athletes
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Only admins can approve athletes' }, { status: 401 });
    }

    const body = await request.json();
    const {
      athleteId,
      trainingDays,
      trainingHours,
      group,
      youthCategory,
      isCompetition,
    } = body;

    // Validate required fields
    if (!athleteId || !trainingDays || !trainingHours || !group || !youthCategory) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate training days
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (!Array.isArray(trainingDays) || trainingDays.length === 0) {
      return NextResponse.json(
        { error: 'Training days must be a non-empty array' },
        { status: 400 }
      );
    }
    if (!trainingDays.every((day: string) => validDays.includes(day.toLowerCase()))) {
      return NextResponse.json(
        { error: 'Invalid training day' },
        { status: 400 }
      );
    }

    // Validate training hours
    const validHours = ['first', 'second', 'both'];
    if (!Array.isArray(trainingHours) || trainingHours.length === 0) {
      return NextResponse.json(
        { error: 'Training hours must be a non-empty array' },
        { status: 400 }
      );
    }
    if (!trainingHours.every((hour: string) => validHours.includes(hour.toLowerCase()))) {
      return NextResponse.json(
        { error: 'Invalid training hour' },
        { status: 400 }
      );
    }

    // Validate group
    if (![1, 2, 3].includes(Number(group))) {
      return NextResponse.json(
        { error: 'Group must be 1, 2, or 3' },
        { status: 400 }
      );
    }

    // Get athlete data
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
    });

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    // Update athlete status and configuration
    const updatedAthlete = await prisma.athlete.update({
      where: { id: athleteId },
      data: {
        isApproved: true,
        approvedBy: session.user.id,
        approvedAt: new Date(),
        configuredAt: new Date(),
        youthCategory,
        competitionParticipation: Boolean(isCompetition),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        performedBy: session.user.id,
        action: 'create',
        entityType: 'athlete',
        entityId: athleteId,
        changes: {
          athleteName: `${athlete.firstName} ${athlete.lastName}`,
          athleteEmail: athlete.email,
          trainingDays,
          trainingHours,
          group,
          youthCategory,
          isCompetition,
        },
        reason: 'Athlete approved and configured',
      },
    });

    // Send approval email
    try {
      await sendAthleteApprovalEmail({
        athleteEmail: athlete.email,
        guardianEmail: athlete.guardianEmail || undefined,
        athleteName: `${athlete.firstName} ${athlete.lastName}`,
        trainingDays,
        trainingHours,
        group: Number(group),
        youthCategory,
        isCompetition: Boolean(isCompetition),
      });
      console.log('✅ Approval email sent successfully');
    } catch (emailError) {
      // Log error but don't fail the request
      console.error('❌ Failed to send approval email:', emailError);
    }

    return NextResponse.json({
      message: 'Athlete approved successfully',
      athlete: updatedAthlete,
    });
  } catch (error) {
    console.error('Error approving athlete:', error);
    return NextResponse.json(
      { error: 'Failed to approve athlete' },
      { status: 500 }
    );
  }
}