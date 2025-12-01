import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { subHours } from 'date-fns';
import { parseVirtualSessionId } from '@/lib/sessions/virtual-sessions';

const cancellationSchema = z.object({
  trainingSessionId: z.string(),
  reason: z.string().min(10, 'Grund muss mindestens 10 Zeichen haben'),
});

// POST - Create a new trainer cancellation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    if (!session.user.trainerProfileId) {
      return NextResponse.json({ error: 'Kein Trainer-Profil' }, { status: 403 });
    }

    const trainerId = session.user.trainerProfileId;

    const body = await request.json();

    const validation = cancellationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { trainingSessionId, reason } = validation.data;

    // Handle virtual session IDs - create the actual session if needed
    let actualSessionId = trainingSessionId;
    const virtualParsed = parseVirtualSessionId(trainingSessionId);
    
    if (virtualParsed) {
      // Check if session already exists for this recurring training and date
      const existingSession = await prisma.trainingSession.findFirst({
        where: {
          recurringTrainingId: virtualParsed.recurringTrainingId,
          date: virtualParsed.date,
        },
      });

      if (existingSession) {
        actualSessionId = existingSession.id;
      } else {
        // Create the session from the recurring training
        const recurringTraining = await prisma.recurringTraining.findUnique({
          where: { id: virtualParsed.recurringTrainingId },
          include: { trainingGroups: true },
        });

        if (!recurringTraining) {
          return NextResponse.json(
            { error: 'Training nicht gefunden' },
            { status: 404 }
          );
        }

        // Create the actual session
        const newSession = await prisma.trainingSession.create({
          data: {
            recurringTrainingId: virtualParsed.recurringTrainingId,
            date: virtualParsed.date,
            dayOfWeek: recurringTraining.dayOfWeek,
            startTime: recurringTraining.startTime,
            endTime: recurringTraining.endTime,
            sessionGroups: {
              create: recurringTraining.trainingGroups.map((group) => ({
                trainingGroupId: group.id,
              })),
            },
          },
        });

        actualSessionId = newSession.id;
      }
    }

    // Get session and settings
    const [trainingSession, settings] = await Promise.all([
      prisma.trainingSession.findUnique({
        where: { id: actualSessionId },
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

    // Check deadline (same as athletes)
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
    const existing = await prisma.trainerCancellation.findUnique({
      where: {
        trainerId_trainingSessionId: {
          trainerId,
          trainingSessionId: actualSessionId,
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
    const cancellation = existing
      ? await prisma.trainerCancellation.update({
          where: { id: existing.id },
          data: { isActive: true, reason, cancelledAt: new Date(), undoneAt: null },
        })
      : await prisma.trainerCancellation.create({
          data: {
            trainerId,
            trainingSessionId: actualSessionId,
            reason,
          },
        });

    return NextResponse.json({ data: cancellation }, { status: 201 });
  } catch (error) {
    console.error('Trainer cancellation error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Absagen des Trainings' },
      { status: 500 }
    );
  }
}

// GET - Get trainer's cancellations
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    if (!session.user.trainerProfileId) {
      return NextResponse.json({ error: 'Kein Trainer-Profil' }, { status: 403 });
    }

    const trainerId = session.user.trainerProfileId;

    const cancellations = await prisma.trainerCancellation.findMany({
      where: {
        trainerId,
        isActive: true,
      },
      include: {
        trainingSession: {
          include: {
            recurringTraining: true,
          },
        },
      },
      orderBy: { cancelledAt: 'desc' },
    });

    return NextResponse.json({ data: cancellations });
  } catch (error) {
    console.error('Get trainer cancellations error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Absagen' },
      { status: 500 }
    );
  }
}
