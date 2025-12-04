import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseVirtualSessionId } from '@/lib/sessions/virtual-sessions';

// POST - Confirm or decline attendance for a session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, confirmed } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session-ID erforderlich' }, { status: 400 });
    }

    if (typeof confirmed !== 'boolean') {
      return NextResponse.json(
        { error: 'Bestätigung muss true oder false sein' },
        { status: 400 }
      );
    }

    // Get system settings to check deadline
    const settings = await prisma.systemSettings.findFirst({
      where: { id: 'default' },
    });

    let actualSessionId = sessionId;

    // Handle virtual session IDs - create the actual session first
    const virtualInfo = parseVirtualSessionId(sessionId);
    if (virtualInfo) {
      // Check if session already exists
      const existingSession = await prisma.trainingSession.findFirst({
        where: {
          recurringTrainingId: virtualInfo.recurringTrainingId,
          date: virtualInfo.date,
        },
      });

      if (existingSession) {
        actualSessionId = existingSession.id;
      } else {
        // Get recurring training details
        const recurringTraining = await prisma.recurringTraining.findUnique({
          where: { id: virtualInfo.recurringTrainingId },
        });

        if (!recurringTraining) {
          return NextResponse.json({ error: 'Training nicht gefunden' }, { status: 404 });
        }

        // Create the session
        const newSession = await prisma.trainingSession.create({
          data: {
            recurringTrainingId: virtualInfo.recurringTrainingId,
            date: virtualInfo.date,
            dayOfWeek: recurringTraining.dayOfWeek,
            startTime: recurringTraining.startTime,
            endTime: recurringTraining.endTime,
          },
        });
        actualSessionId = newSession.id;
      }
    }

    // Get the session to check deadline
    const trainingSession = await prisma.trainingSession.findUnique({
      where: { id: actualSessionId },
      include: {
        recurringTraining: true,
      },
    });

    if (!trainingSession) {
      return NextResponse.json({ error: 'Training nicht gefunden' }, { status: 404 });
    }

    // Check if changing confirmation is within deadline
    if (settings) {
      const sessionDateTime = new Date(trainingSession.date);
      const startTime = trainingSession.startTime || trainingSession.recurringTraining?.startTime || '00:00';
      const [hours, minutes] = startTime.split(':').map(Number);
      sessionDateTime.setHours(hours, minutes, 0, 0);

      const deadlineTime = new Date(sessionDateTime);
      deadlineTime.setHours(deadlineTime.getHours() - settings.cancellationDeadlineHours);

      if (new Date() > deadlineTime) {
        return NextResponse.json(
          { error: `Änderungen sind nur bis ${settings.cancellationDeadlineHours} Stunden vor dem Training möglich` },
          { status: 400 }
        );
      }
    }

    // Determine if user is athlete or trainer
    const isAthlete = session.user.activeRole === 'ATHLETE';
    const isTrainer = session.user.activeRole === 'TRAINER' || session.user.activeRole === 'ADMIN';

    if (isAthlete && session.user.athleteProfileId) {
      // Check if athlete is in an absence period
      const now = new Date();
      const absencePeriod = await prisma.absencePeriod.findFirst({
        where: {
          athleteId: session.user.athleteProfileId,
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
      });

      if (absencePeriod && confirmed) {
        return NextResponse.json(
          { error: 'Du bist als abwesend markiert. Kontaktiere einen Admin.' },
          { status: 400 }
        );
      }

      // Upsert confirmation for athlete
      await prisma.sessionConfirmation.upsert({
        where: {
          trainingSessionId_athleteId: {
            trainingSessionId: actualSessionId,
            athleteId: session.user.athleteProfileId,
          },
        },
        update: {
          confirmed,
          confirmedAt: new Date(),
        },
        create: {
          trainingSessionId: actualSessionId,
          athleteId: session.user.athleteProfileId,
          confirmed,
        },
      });
    } else if (isTrainer && session.user.trainerProfileId) {
      // Check if trainer is in an absence period
      const now = new Date();
      const absencePeriod = await prisma.absencePeriod.findFirst({
        where: {
          trainerId: session.user.trainerProfileId,
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
      });

      if (absencePeriod && confirmed) {
        return NextResponse.json(
          { error: 'Du bist als abwesend markiert. Kontaktiere einen Admin.' },
          { status: 400 }
        );
      }

      // Upsert confirmation for trainer
      await prisma.sessionConfirmation.upsert({
        where: {
          trainingSessionId_trainerId: {
            trainingSessionId: actualSessionId,
            trainerId: session.user.trainerProfileId,
          },
        },
        update: {
          confirmed,
          confirmedAt: new Date(),
        },
        create: {
          trainingSessionId: actualSessionId,
          trainerId: session.user.trainerProfileId,
          confirmed,
        },
      });
    } else {
      return NextResponse.json({ error: 'Profil nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: confirmed ? 'Teilnahme bestätigt' : 'Absage gespeichert',
    });
  } catch (error) {
    console.error('Session confirmation error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Bestätigung' },
      { status: 500 }
    );
  }
}

// GET - Get confirmations for a session
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session-ID erforderlich' }, { status: 400 });
    }

    // Handle virtual session IDs
    let actualSessionId = sessionId;
    const virtualInfo = parseVirtualSessionId(sessionId);
    if (virtualInfo) {
      const existingSession = await prisma.trainingSession.findFirst({
        where: {
          recurringTrainingId: virtualInfo.recurringTrainingId,
          date: virtualInfo.date,
        },
      });
      if (existingSession) {
        actualSessionId = existingSession.id;
      } else {
        // No stored session yet, return empty confirmations
        return NextResponse.json({ data: { athletes: [], trainers: [] } });
      }
    }

    const confirmations = await prisma.sessionConfirmation.findMany({
      where: { trainingSessionId: actualSessionId },
      include: {
        athlete: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        trainer: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    const athleteConfirmations = confirmations
      .filter((c) => c.athleteId)
      .map((c) => ({
        athleteId: c.athleteId,
        name: `${c.athlete?.user.firstName} ${c.athlete?.user.lastName}`,
        confirmed: c.confirmed,
        confirmedAt: c.confirmedAt?.toISOString(),
      }));

    const trainerConfirmations = confirmations
      .filter((c) => c.trainerId)
      .map((c) => ({
        trainerId: c.trainerId,
        name: `${c.trainer?.user.firstName} ${c.trainer?.user.lastName}`,
        confirmed: c.confirmed,
        confirmedAt: c.confirmedAt?.toISOString(),
      }));

    return NextResponse.json({
      data: {
        athletes: athleteConfirmations,
        trainers: trainerConfirmations,
      },
    });
  } catch (error) {
    console.error('Session confirmation GET error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Bestätigungen' },
      { status: 500 }
    );
  }
}
