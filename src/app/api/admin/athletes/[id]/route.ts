import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/authHelpers';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface RouteContext {
  params: { id: string };
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await requireAdmin();
    const { id: athleteId } = context.params;
    const body = await request.json();

    const {
      firstName,
      lastName,
      birthDate,
      phone,
      youthCategory,
      competitionParticipation,
      hasDtbId,
      isApproved,
    } = body;

    // Check if athlete profile exists
    const existingAthlete = await prisma.athleteProfile.findUnique({
      where: { id: athleteId },
      include: { user: true },
    });

    if (!existingAthlete) {
      return NextResponse.json({ success: false, error: 'Athlete not found' }, { status: 404 });
    }

    // Build update data for User fields
    const userUpdateData: any = {};
    if (firstName !== undefined) userUpdateData.firstName = firstName;
    if (lastName !== undefined) userUpdateData.lastName = lastName;
    if (birthDate !== undefined) userUpdateData.birthDate = new Date(birthDate);
    if (phone !== undefined) userUpdateData.phone = phone;

    // Build update data for AthleteProfile fields
    const profileUpdateData: any = {};
    if (youthCategory !== undefined) profileUpdateData.youthCategory = youthCategory;
    if (competitionParticipation !== undefined) profileUpdateData.competitionParticipation = competitionParticipation;
    if (hasDtbId !== undefined) profileUpdateData.hasDtbId = hasDtbId;
    if (isApproved !== undefined) profileUpdateData.isApproved = isApproved;

    // Update both User and AthleteProfile
    const updatedAthlete = await prisma.athleteProfile.update({
      where: { id: athleteId },
      data: {
        ...profileUpdateData,
        user: {
          update: userUpdateData,
        },
      },
      include: { user: true },
    });

    return NextResponse.json({
      success: true,
      data: updatedAthlete,
    });
  } catch (error) {
    console.error('Error updating athlete:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update athlete' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await requireAdmin();
    const { id: athleteId } = context.params;

    // Get athlete info before deletion for email
    const athlete = await prisma.athleteProfile.findUnique({
      where: { id: athleteId },
      include: { user: true },
    });

    if (!athlete) {
      return NextResponse.json({ success: false, error: 'Athlete not found' }, { status: 404 });
    }

    const athleteName = `${athlete.user.firstName} ${athlete.user.lastName}`;
    const athleteEmail = athlete.user.email;
    const userId = athlete.userId;

    // Delete all related data and user (Prisma cascade should handle profile deletion)
    await prisma.$transaction([
      // Delete absence alerts
      prisma.absenceAlert.deleteMany({ where: { athleteId } }),
      // Delete cancellations
      prisma.cancellation.deleteMany({ where: { athleteId } }),
      // Delete attendance records
      prisma.attendanceRecord.deleteMany({ where: { athleteId } }),
      // Delete session assignments
      prisma.sessionAthleteAssignment.deleteMany({ where: { athleteId } }),
      // Delete recurring training assignments
      prisma.recurringTrainingAthleteAssignment.deleteMany({ where: { athleteId } }),
      // Delete athlete profile (will cascade to user if user has no trainer profile)
      prisma.athleteProfile.delete({ where: { id: athleteId } }),
      // Delete user if they don't have a trainer profile
      prisma.user.deleteMany({ 
        where: { 
          id: userId,
          trainerProfile: null,
        } 
      }),
    ]);

    // Send notification email to the athlete
    try {
      await resend.emails.send({
        from: 'SV Esting Turnen <noreply@svesting.de>',
        to: athleteEmail,
        subject: 'Konto-Entfernung - SV Esting Turnen',
        html: `
          <h2>Hallo ${athleteName},</h2>
          <p>Dein Konto beim SV Esting Turnen wurde von einem Administrator aus dem System entfernt.</p>
          <p>Alle deine Daten, Trainingszuweisungen und Anwesenheitsaufzeichnungen wurden gelöscht.</p>
          <p>Bei Fragen kannst du dich gerne an die Geschäftsstelle wenden.</p>
          <br>
          <p>Mit sportlichen Grüßen,<br>SV Esting Turnen</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send removal notification email:', emailError);
      // Continue even if email fails
    }

    return NextResponse.json({
      success: true,
      message: `${athleteName} was successfully removed and notified via email`,
    });
  } catch (error) {
    console.error('Error removing athlete:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove athlete' },
      { status: 500 }
    );
  }
}
