import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

// POST - Send bulk email to selected recipients
export async function POST(request: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { subject, message, recipientType, groupIds, athleteIds } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Betreff und Nachricht sind erforderlich' },
        { status: 400 }
      );
    }

    const emailsToSend = new Set<string>();

    // Determine recipients based on type
    switch (recipientType) {
      case 'all_athletes':
        // Get all approved athletes
        const allAthletes = await prisma.athleteProfile.findMany({
          where: { isApproved: true },
          include: {
            user: { select: { email: true } },
          },
        });
        allAthletes.forEach((a) => emailsToSend.add(a.user.email));
        break;

      case 'all_trainers':
        // Get all active trainers
        const allTrainers = await prisma.trainerProfile.findMany({
          where: { isActive: true },
          include: {
            user: { select: { email: true } },
          },
        });
        allTrainers.forEach((t) => emailsToSend.add(t.user.email));
        break;

      case 'all':
        // Get all approved athletes and active trainers
        const athletes = await prisma.athleteProfile.findMany({
          where: { isApproved: true },
          include: {
            user: { select: { email: true } },
          },
        });
        const trainers = await prisma.trainerProfile.findMany({
          where: { isActive: true },
          include: {
            user: { select: { email: true } },
          },
        });
        athletes.forEach((a) => emailsToSend.add(a.user.email));
        trainers.forEach((t) => emailsToSend.add(t.user.email));
        break;

      case 'groups':
        // Get athletes in specific training groups
        if (!groupIds || groupIds.length === 0) {
          return NextResponse.json(
            { error: 'Bitte wählen Sie mindestens eine Gruppe aus' },
            { status: 400 }
          );
        }
        const groupAthletes = await prisma.recurringTrainingAthleteAssignment.findMany({
          where: { trainingGroupId: { in: groupIds } },
          include: {
            athlete: {
              include: {
                user: { select: { email: true } },
              },
            },
          },
        });
        groupAthletes.forEach((a) => emailsToSend.add(a.athlete.user.email));
        break;

      case 'selected':
        // Get specific athletes
        if (!athleteIds || athleteIds.length === 0) {
          return NextResponse.json(
            { error: 'Bitte wählen Sie mindestens einen Athleten aus' },
            { status: 400 }
          );
        }
        const selectedAthletes = await prisma.athleteProfile.findMany({
          where: { id: { in: athleteIds } },
          include: {
            user: { select: { email: true } },
          },
        });
        selectedAthletes.forEach((a) => emailsToSend.add(a.user.email));
        break;

      default:
        return NextResponse.json(
          { error: 'Ungültiger Empfängertyp' },
          { status: 400 }
        );
    }

    if (emailsToSend.size === 0) {
      return NextResponse.json(
        { error: 'Keine Empfänger gefunden' },
        { status: 400 }
      );
    }

    // Get sender info
    const sender = await prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { firstName: true, lastName: true, email: true },
    });

    // Create HTML email content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1a365d; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f8f9fa; }
    .message { background-color: white; padding: 20px; border-radius: 5px; margin: 15px 0; white-space: pre-wrap; }
    .footer { text-align: center; padding: 20px; color: #718096; font-size: 12px; }
    .sender { margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SV Esting Turnen</h1>
    </div>
    <div class="content">
      <h2>${subject}</h2>
      <div class="message">${message.replace(/\n/g, '<br>')}</div>
      <div class="sender">
        <p>Mit sportlichen Grüßen,</p>
        <p><strong>${sender?.firstName} ${sender?.lastName}</strong></p>
      </div>
    </div>
    <div class="footer">
      <p>Diese E-Mail wurde über den SV Esting Gymnastics Manager gesendet.</p>
      <p>Bei Fragen wenden Sie sich bitte an: ${sender?.email}</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send the email
    const result = await sendEmail({
      to: Array.from(emailsToSend),
      subject: `[SV Esting] ${subject}`,
      html: htmlContent,
      replyTo: sender?.email,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `E-Mail erfolgreich an ${emailsToSend.size} Empfänger gesendet`,
        recipientCount: emailsToSend.size,
      });
    } else {
      throw new Error('Failed to send email');
    }
  } catch (err) {
    console.error('Bulk email error:', err);
    return NextResponse.json(
      { error: 'Fehler beim Senden der E-Mail' },
      { status: 500 }
    );
  }
}

// GET - Get available recipients for selection
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'groups') {
      // Get all training groups with athlete counts
      const groups = await prisma.trainingGroup.findMany({
        include: {
          recurringTraining: true,
          _count: {
            select: { athleteAssignments: true },
          },
        },
        orderBy: [
          { recurringTraining: { name: 'asc' } },
          { name: 'asc' },
        ],
      });

      return NextResponse.json({
        data: groups.map((g) => ({
          id: g.id,
          name: `${g.recurringTraining.name} - ${g.name}`,
          athleteCount: g._count.athleteAssignments,
        })),
      });
    }

    if (type === 'athletes') {
      // Get all approved athletes
      const athletes = await prisma.athleteProfile.findMany({
        where: { isApproved: true },
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: [
          { user: { lastName: 'asc' } },
          { user: { firstName: 'asc' } },
        ],
      });

      return NextResponse.json({
        data: athletes.map((a) => ({
          id: a.id,
          name: `${a.user.firstName} ${a.user.lastName}`,
          email: a.user.email,
        })),
      });
    }

    // Get summary counts
    const [athleteCount, trainerCount, groupCount] = await Promise.all([
      prisma.athleteProfile.count({ where: { isApproved: true } }),
      prisma.trainerProfile.count({ where: { isActive: true } }),
      prisma.trainingGroup.count(),
    ]);

    return NextResponse.json({
      data: {
        athleteCount,
        trainerCount,
        groupCount,
      },
    });
  } catch (err) {
    console.error('Bulk email recipients error:', err);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Empfänger' },
      { status: 500 }
    );
  }
}
