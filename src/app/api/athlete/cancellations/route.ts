import { NextRequest, NextResponse } from 'next/server';
import { requireAthlete } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { subHours } from 'date-fns';

const cancellationSchema = z.object({
  trainingSessionId: z.string(),
  reason: z.string().min(10, 'Grund muss mindestens 10 Zeichen haben'),
});

// POST - Create a new cancellation
export async function POST(request: NextRequest) {
  const { session, error } = await requireAthlete();
  if (error) return error;

  const athleteId = session!.user.athleteProfileId!;

  try {
    const body = await request.json();

    const validation = cancellationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { trainingSessionId, reason } = validation.data;

    // Get session and settings
    const [trainingSession, settings] = await Promise.all([
      prisma.trainingSession.findUnique({
        where: { id: trainingSessionId },
        include: { recurringTraining: true },
      }),
      prisma.systemSettings.findUnique({ where: { id: 'default' } }),
    ]);

    if (!trainingSession) {
      return NextResponse.json(
        { error: 'Training nicht gefunden' },
        { status: 404 }
      );
    }

    // Check deadline
    const deadlineHours = settings?.cancellationDeadlineHours || 2;
    const sessionStart = new Date(trainingSession.date);
    const timeStr = trainingSession.startTime || trainingSession.recurringTraining?.startTime || '00:00';
    const [hours, minutes] = timeStr.split(':').map(Number);
    sessionStart.setHours(hours, minutes);

    const deadline = subHours(sessionStart, deadlineHours);

    if (new Date() > deadline) {
      return NextResponse.json(
        { error: 'Absagefrist überschritten' },
        { status: 400 }
      );
    }

    // Check if already cancelled
    const existing = await prisma.cancellation.findUnique({
      where: {
        athleteId_trainingSessionId: {
          athleteId,
          trainingSessionId,
        },
      },
    });

    if (existing && existing.isActive) {
      return NextResponse.json(
        { error: 'Training bereits abgesagt' },
        { status: 400 }
      );
    }

    // Create or reactivate cancellation
    const cancellation = await prisma.cancellation.upsert({
      where: {
        athleteId_trainingSessionId: {
          athleteId,
          trainingSessionId,
        },
      },
      update: {
        reason,
        isActive: true,
        cancelledAt: new Date(),
        undoneAt: null,
      },
      create: {
        athleteId,
        trainingSessionId,
        reason,
      },
    });

    return NextResponse.json({
      data: cancellation,
      message: 'Training erfolgreich abgesagt',
    });
  } catch (err) {
    console.error('Cancellation POST error:', err);
    return NextResponse.json(
      { error: 'Fehler beim Absagen des Trainings' },
      { status: 500 }
    );
  }
}

// GET - Get active cancellations
export async function GET() {
  const { session, error } = await requireAthlete();
  if (error) return error;

  const athleteId = session!.user.athleteProfileId!;

  try {
    const cancellations = await prisma.cancellation.findMany({
      where: {
        athleteId,
        isActive: true,
        trainingSession: {
          date: { gte: new Date() },
        },
      },
      include: {
        trainingSession: {
          include: { recurringTraining: true },
        },
      },
      orderBy: {
        trainingSession: { date: 'asc' },
      },
    });

    return NextResponse.json({
      data: cancellations.map((c) => ({
        id: c.id,
        reason: c.reason,
        cancelledAt: c.cancelledAt.toISOString(),
        trainingSession: {
          id: c.trainingSession.id,
          date: c.trainingSession.date.toISOString(),
          name: c.trainingSession.recurringTraining?.name || 'Training',
          startTime: c.trainingSession.startTime || c.trainingSession.recurringTraining?.startTime || '00:00',
          endTime: c.trainingSession.endTime || c.trainingSession.recurringTraining?.endTime || '00:00',
        },
      })),
    });
  } catch (err) {
    console.error('Cancellation GET error:', err);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Absagen' },
      { status: 500 }
    );
  }
}
