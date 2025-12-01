import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // Reject the athlete (set to inactive)
    await prisma.athleteProfile.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    return NextResponse.json({
      success: true,
      message: `Anmeldung von ${athlete.user.firstName} ${athlete.user.lastName} wurde abgelehnt`,
    });
  } catch (error) {
    console.error('Reject athlete error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Ablehnen' },
      { status: 500 }
    );
  }
}
