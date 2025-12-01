import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendApprovalNotification } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    if (session.user.activeRole !== 'TRAINER' && session.user.activeRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    const { id } = await params;

    const athlete = await prisma.athleteProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!athlete) {
      return NextResponse.json({ error: 'Athlet nicht gefunden' }, { status: 404 });
    }

    if (athlete.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Athlet ist nicht im Status "Ausstehend"' },
        { status: 400 }
      );
    }

    // Get trainer profile for approvedBy
    const trainerProfile = await prisma.trainerProfile.findUnique({
      where: { userId: session.user.id },
    });

    // Approve the athlete
    await prisma.athleteProfile.update({
      where: { id },
      data: { 
        status: 'ACTIVE',
        approvedBy: trainerProfile?.id,
        approvedAt: new Date(),
      },
    });

    // Send approval notification email to athlete
    await sendApprovalNotification(athlete.user.email, {
      firstName: athlete.user.firstName,
      lastName: athlete.user.lastName,
    });

    return NextResponse.json({
      success: true,
      message: `${athlete.user.firstName} ${athlete.user.lastName} wurde freigeschaltet`,
    });
  } catch (error) {
    console.error('Approve athlete error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Freischalten' },
      { status: 500 }
    );
  }
}
