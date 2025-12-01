import { NextRequest, NextResponse } from 'next/server';
import { requireAthlete } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { subHours } from 'date-fns';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Helper to check deadline
async function checkDeadline(cancellationId: string, athleteId: string) {
  const cancellation = await prisma.cancellation.findFirst({
    where: { id: cancellationId, athleteId, isActive: true },
    include: {
      trainingSession: { include: { recurringTraining: true } },
    },
  });

  if (!cancellation) {
    return { error: 'Absage nicht gefunden', status: 404 };
  }

  const settings = await prisma.systemSettings.findUnique({
    where: { id: 'default' },
  });
  const deadlineHours = settings?.cancellationDeadlineHours || 2;
  
  const sessionStart = new Date(cancellation.trainingSession.date);
  const timeStr = cancellation.trainingSession.startTime ||
    cancellation.trainingSession.recurringTraining?.startTime || '00:00';
  const [hours, minutes] = timeStr.split(':').map(Number);
  sessionStart.setHours(hours, minutes);

  if (new Date() > subHours(sessionStart, deadlineHours)) {
    return { error: 'Absagefrist überschritten', status: 400 };
  }

  return { cancellation };
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

    const check = await checkDeadline(id, athleteId);
    if ('error' in check) {
      return NextResponse.json(
        { error: check.error },
        { status: check.status }
      );
    }

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
    const check = await checkDeadline(id, athleteId);
    if ('error' in check) {
      return NextResponse.json(
        { error: check.error },
        { status: check.status }
      );
    }

    const updated = await prisma.cancellation.update({
      where: { id },
      data: {
        isActive: false,
        undoneAt: new Date(),
      },
    });

    return NextResponse.json({
      data: updated,
      message: 'Absage zurückgenommen',
    });
  } catch (err) {
    console.error('Cancellation DELETE error:', err);
    return NextResponse.json(
      { error: 'Fehler beim Zurücknehmen der Absage' },
      { status: 500 }
    );
  }
}
