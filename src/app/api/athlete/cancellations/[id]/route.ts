import { NextRequest, NextResponse } from 'next/server';
import { requireAthlete } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { subHours } from 'date-fns';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT - Update cancellation reason
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const { session, error } = await requireAthlete();
  if (error) return error;

  const athleteId = session!.user.athleteProfileId!;
  const { id } = await params;

  try {
    const { reason } = await request.json();

    if (!reason || reason.length < 10) {
      return NextResponse.json(
        { error: 'Grund muss mindestens 10 Zeichen haben' },
        { status: 400 }
      );
    }

    const cancellation = await prisma.cancellation.findFirst({
      where: { id, athleteId, isActive: true },
      include: {
        trainingSession: { include: { recurringTraining: true } },
      },
    });

    if (!cancellation) {
      return NextResponse.json(
        { error: 'Absage nicht gefunden' },
        { status: 404 }
      );
    }

    // Check if session has already passed
    const sessionStart = new Date(cancellation.trainingSession.date);
    const timeStr = cancellation.trainingSession.startTime ||
      cancellation.trainingSession.recurringTraining?.startTime || '00:00';
    const [hours, minutes] = timeStr.split(':').map(Number);
    sessionStart.setHours(hours, minutes);

    if (new Date() > sessionStart) {
      return NextResponse.json(
        { error: 'Training hat bereits stattgefunden' },
        { status: 400 }
      );
    }

    // BUG FIX #7: Allow editing reason even after deadline (reason update doesn't affect late status)
    const updated = await prisma.cancellation.update({
      where: { id },
      data: { reason },
    });

    return NextResponse.json({
      data: updated,
      message: 'Absage aktualisiert',
    });
  } catch (err) {
    console.error('Cancellation PUT error:', err);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Absage' },
      { status: 500 }
    );
  }
}

// DELETE - Undo cancellation
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const { session, error } = await requireAthlete();
  if (error) return error;

  const athleteId = session!.user.athleteProfileId!;
  const { id } = await params;

  try {
    const cancellation = await prisma.cancellation.findFirst({
      where: { id, athleteId, isActive: true },
      include: {
        trainingSession: { include: { recurringTraining: true } },
      },
    });

    if (!cancellation) {
      return NextResponse.json(
        { error: 'Absage nicht gefunden' },
        { status: 404 }
      );
    }

    // Check if session has already passed
    const sessionStart = new Date(cancellation.trainingSession.date);
    const timeStr = cancellation.trainingSession.startTime ||
      cancellation.trainingSession.recurringTraining?.startTime || '00:00';
    const [hours, minutes] = timeStr.split(':').map(Number);
    sessionStart.setHours(hours, minutes);

    if (new Date() > sessionStart) {
      return NextResponse.json(
        { error: 'Training hat bereits stattgefunden' },
        { status: 400 }
      );
    }

    // Get settings for deadline check (for warning only)
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' },
    });
    const deadlineHours = settings?.cancellationDeadlineHours || 2;
    const deadline = subHours(sessionStart, deadlineHours);
    const isPastDeadline = new Date() > deadline;

    // BUG FIX #7: Allow undo but warn if past deadline
    // The athlete will be considered confirmed if they undo, 
    // but since the original cancellation was late, it may still affect their record
    const updated = await prisma.cancellation.update({
      where: { id },
      data: {
        isActive: false,
        undoneAt: new Date(),
      },
    });

    let message = 'Absage zurückgenommen';
    if (isPastDeadline) {
      message = `Absage zurückgenommen. Hinweis: Die Frist (${deadlineHours} Stunden vor Trainingsbeginn) ist bereits abgelaufen.`;
    }

    return NextResponse.json({
      data: updated,
      message,
      isPastDeadline,
    });
  } catch (err) {
    console.error('Cancellation DELETE error:', err);
    return NextResponse.json(
      { error: 'Fehler beim Rückgängigmachen der Absage' },
      { status: 500 }
    );
  }
}