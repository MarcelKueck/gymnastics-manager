import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { acknowledgeAlert } from '@/lib/services/absenceAlertService';
import { prisma } from '@/lib/prisma';

export async function PATCH(
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

    // Get trainer profile
    const trainerProfile = await prisma.trainerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!trainerProfile) {
      return NextResponse.json({ error: 'Trainer-Profil nicht gefunden' }, { status: 404 });
    }

    // Acknowledge the alert
    await acknowledgeAlert(id, trainerProfile.id);

    return NextResponse.json({
      success: true,
      message: 'Warnung wurde als gelesen markiert',
    });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Markieren der Warnung' },
      { status: 500 }
    );
  }
}
