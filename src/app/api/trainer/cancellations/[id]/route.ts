import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE - Undo a trainer cancellation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    if (!session.user.trainerProfileId) {
      return NextResponse.json({ error: 'Kein Trainer-Profil' }, { status: 403 });
    }

    const trainerId = session.user.trainerProfileId;
    const { id } = await params;

    // Find the cancellation
    const cancellation = await prisma.trainerCancellation.findUnique({
      where: { id },
      include: {
        trainingSession: {
          include: { recurringTraining: true },
        },
      },
    });

    if (!cancellation) {
      return NextResponse.json(
        { error: 'Absage nicht gefunden' },
        { status: 404 }
      );
    }

    // Check ownership
    if (cancellation.trainerId !== trainerId) {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      );
    }

    // Check if session hasn't passed
    const sessionDate = new Date(cancellation.trainingSession.date);
    const timeStr = cancellation.trainingSession.startTime || 
                    cancellation.trainingSession.recurringTraining?.startTime || '00:00';
    const [hours, minutes] = timeStr.split(':').map(Number);
    sessionDate.setHours(hours, minutes);

    if (new Date() > sessionDate) {
      return NextResponse.json(
        { error: 'Training hat bereits stattgefunden' },
        { status: 400 }
      );
    }

    // Undo the cancellation
    await prisma.trainerCancellation.update({
      where: { id },
      data: {
        isActive: false,
        undoneAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Undo trainer cancellation error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Rückgängigmachen der Absage' },
      { status: 500 }
    );
  }
}

// PATCH - Update cancellation reason
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    if (!session.user.trainerProfileId) {
      return NextResponse.json({ error: 'Kein Trainer-Profil' }, { status: 403 });
    }

    const trainerId = session.user.trainerProfileId;
    const { id } = await params;
    const body = await request.json();

    if (!body.reason || body.reason.length < 10) {
      return NextResponse.json(
        { error: 'Grund muss mindestens 10 Zeichen haben' },
        { status: 400 }
      );
    }

    // Find the cancellation
    const cancellation = await prisma.trainerCancellation.findUnique({
      where: { id },
    });

    if (!cancellation) {
      return NextResponse.json(
        { error: 'Absage nicht gefunden' },
        { status: 404 }
      );
    }

    // Check ownership
    if (cancellation.trainerId !== trainerId) {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      );
    }

    // Update reason
    const updated = await prisma.trainerCancellation.update({
      where: { id },
      data: { reason: body.reason },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Update trainer cancellation error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Absage' },
      { status: 500 }
    );
  }
}
