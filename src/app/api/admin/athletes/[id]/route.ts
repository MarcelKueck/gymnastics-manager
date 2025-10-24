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

    // Check if athlete exists
    const existingAthlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
    });

    if (!existingAthlete) {
      return NextResponse.json({ success: false, error: 'Athlete not found' }, { status: 404 });
    }

    // Build update data object
    const updateData: any = {};
    
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (birthDate !== undefined) updateData.birthDate = new Date(birthDate);
    if (phone !== undefined) updateData.phone = phone;
    if (youthCategory !== undefined) updateData.youthCategory = youthCategory;
    if (competitionParticipation !== undefined) updateData.competitionParticipation = competitionParticipation;
    if (hasDtbId !== undefined) updateData.hasDtbId = hasDtbId;
    if (isApproved !== undefined) updateData.isApproved = isApproved;

    const updatedAthlete = await prisma.athlete.update({
      where: { id: athleteId },
      data: updateData,
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
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
    });

    if (!athlete) {
      return NextResponse.json({ success: false, error: 'Athlete not found' }, { status: 404 });
    }

    const athleteName = `${athlete.firstName} ${athlete.lastName}`;
    const athleteEmail = athlete.email;

    // Delete all related data (Prisma cascade should handle most of this)
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
      // Delete athlete profile
      prisma.athlete.delete({ where: { id: athleteId } }),
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
