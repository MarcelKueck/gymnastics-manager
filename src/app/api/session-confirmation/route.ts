import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseVirtualSessionId } from '@/lib/sessions/virtual-sessions';

// Helper to parse group session ID
// Format: virtual_{recurringTrainingId}_{date}_group_{groupId}
// Or legacy: virtual_{recurringTrainingId}_{date} (no group)
// Or real session: {sessionId} or {sessionId}_group_{groupId}
function parseGroupSessionId(id: string): { sessionId: string; groupId: string | null } {
  // Check for new format with _group_ marker
  const groupMatch = id.match(/^(.+)_group_(.+)$/);
  if (groupMatch) {
    return { sessionId: groupMatch[1], groupId: groupMatch[2] };
  }
  
  // Legacy format without group ID
  return { sessionId: id, groupId: null };
}

// POST - Confirm or decline attendance for a session (with optional group)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId: rawSessionId, confirmed, declineReason } = body;

    console.log('[SessionConfirmation] Input:', { rawSessionId, confirmed, declineReason, userId: session.user.id, activeRole: session.user.activeRole });

    if (!rawSessionId) {
      return NextResponse.json({ error: 'Session-ID erforderlich' }, { status: 400 });
    }

    if (typeof confirmed !== 'boolean') {
      return NextResponse.json(
        { error: 'Bestätigung muss true oder false sein' },
        { status: 400 }
      );
    }

    // Parse the session ID to extract group ID if present
    const { sessionId: parsedSessionId, groupId: trainingGroupId } = parseGroupSessionId(rawSessionId);
    
    console.log('[SessionConfirmation] Parsed IDs:', { parsedSessionId, trainingGroupId });

    // Get system settings to check deadline
    const settings = await prisma.systemSettings.findFirst({
      where: { id: 'default' },
    });

    let actualSessionId = parsedSessionId;

    // Handle virtual session IDs - create the actual session first
    const virtualInfo = parseVirtualSessionId(parsedSessionId);
    console.log('[SessionConfirmation] Virtual info:', virtualInfo);
    
    if (virtualInfo) {
      // Check if session already exists
      const existingSession = await prisma.trainingSession.findFirst({
        where: {
          recurringTrainingId: virtualInfo.recurringTrainingId,
          date: virtualInfo.date,
        },
      });

      console.log('[SessionConfirmation] Existing session:', existingSession?.id);

      if (existingSession) {
        actualSessionId = existingSession.id;
      } else {
        // Get recurring training details
        const recurringTraining = await prisma.recurringTraining.findUnique({
          where: { id: virtualInfo.recurringTrainingId },
        });

        if (!recurringTraining) {
          console.log('[SessionConfirmation] Recurring training not found');
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
        console.log('[SessionConfirmation] Created new session:', newSession.id);
      }
    }

    console.log('[SessionConfirmation] Final session ID:', actualSessionId);

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

    // Check if session is already completed (past sessions)
    if (trainingSession.isCompleted) {
      return NextResponse.json(
        { error: 'Vergangene Trainings können nicht mehr geändert werden' },
        { status: 400 }
      );
    }

    // Check if changing confirmation is within deadline
    if (settings) {
      // Extract date parts from the session date (stored in DB as date at midnight UTC)
      // We need to build a proper local datetime from the date + time
      const startTime = trainingSession.startTime || trainingSession.recurringTraining?.startTime || '00:00';
      
      // Get the date as YYYY-MM-DD string to avoid timezone issues
      const dateOnly = trainingSession.date.toISOString().split('T')[0];
      // Create a new date string with the correct time
      const sessionDateTimeStr = `${dateOnly}T${startTime.padStart(5, '0')}:00`;
      const sessionDateTime = new Date(sessionDateTimeStr);

      const deadlineTime = new Date(sessionDateTime.getTime() - settings.cancellationDeadlineHours * 60 * 60 * 1000);

      const now = new Date();
      
      console.log('[SessionConfirmation] Deadline check:', {
        sessionDate: trainingSession.date,
        dateOnly,
        startTime,
        sessionDateTimeStr,
        sessionDateTime: sessionDateTime.toISOString(),
        deadlineTime: deadlineTime.toISOString(),
        now: now.toISOString(),
        deadlineHours: settings.cancellationDeadlineHours,
        isPastDeadline: now > deadlineTime,
      });

      if (now > deadlineTime) {
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

      console.log('[SessionConfirmation] Looking for athlete confirmation:', {
        trainingSessionId: actualSessionId,
        trainingGroupId: trainingGroupId || null,
        athleteId: session.user.athleteProfileId,
      });

      // Upsert confirmation for athlete (with optional group)
      // First, try to find existing record
      const existingAthleteConfirmation = await prisma.sessionConfirmation.findFirst({
        where: {
          trainingSessionId: actualSessionId,
          trainingGroupId: trainingGroupId || null,
          athleteId: session.user.athleteProfileId,
        },
      });

      console.log('[SessionConfirmation] Existing confirmation:', existingAthleteConfirmation?.id);

      if (existingAthleteConfirmation) {
        const updated = await prisma.sessionConfirmation.update({
          where: { id: existingAthleteConfirmation.id },
          data: {
            confirmed,
            declineReason: !confirmed ? declineReason : null,
            confirmedAt: new Date(),
          },
        });
        console.log('[SessionConfirmation] Updated confirmation:', updated);
      } else {
        const created = await prisma.sessionConfirmation.create({
          data: {
            trainingSessionId: actualSessionId,
            trainingGroupId: trainingGroupId || null,
            athleteId: session.user.athleteProfileId,
            confirmed,
            declineReason: !confirmed ? declineReason : null,
          },
        });
        console.log('[SessionConfirmation] Created confirmation:', created);
      }
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

      // Upsert confirmation for trainer (with optional group)
      // First, try to find existing record
      const existingTrainerConfirmation = await prisma.sessionConfirmation.findFirst({
        where: {
          trainingSessionId: actualSessionId,
          trainingGroupId: trainingGroupId || null,
          trainerId: session.user.trainerProfileId,
        },
      });

      if (existingTrainerConfirmation) {
        await prisma.sessionConfirmation.update({
          where: { id: existingTrainerConfirmation.id },
          data: {
            confirmed,
            declineReason: !confirmed ? declineReason : null,
            confirmedAt: new Date(),
          },
        });
      } else {
        await prisma.sessionConfirmation.create({
          data: {
            trainingSessionId: actualSessionId,
            trainingGroupId: trainingGroupId || null,
            trainerId: session.user.trainerProfileId,
            confirmed,
            declineReason: !confirmed ? declineReason : null,
          },
        });
      }
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

// GET - Get confirmations for a session (optionally filtered by group)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rawSessionId = searchParams.get('sessionId');
    const groupIdParam = searchParams.get('groupId');

    if (!rawSessionId) {
      return NextResponse.json({ error: 'Session-ID erforderlich' }, { status: 400 });
    }

    // Parse the session ID to extract group ID if present
    const { sessionId: parsedSessionId, groupId: parsedGroupId } = parseGroupSessionId(rawSessionId);
    const groupId = groupIdParam || parsedGroupId;

    // Handle virtual session IDs
    let actualSessionId = parsedSessionId;
    const virtualInfo = parseVirtualSessionId(parsedSessionId);
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
      where: { 
        trainingSessionId: actualSessionId,
        ...(groupId ? { trainingGroupId: groupId } : {}),
      },
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
        trainingGroup: {
          select: { id: true, name: true },
        },
      },
    });

    const athleteConfirmations = confirmations
      .filter((c) => c.athleteId)
      .map((c) => ({
        athleteId: c.athleteId,
        name: `${c.athlete?.user.firstName} ${c.athlete?.user.lastName}`,
        confirmed: c.confirmed,
        declineReason: c.declineReason,
        confirmedAt: c.confirmedAt?.toISOString(),
        groupId: c.trainingGroupId,
        groupName: c.trainingGroup?.name,
      }));

    const trainerConfirmations = confirmations
      .filter((c) => c.trainerId)
      .map((c) => ({
        trainerId: c.trainerId,
        name: `${c.trainer?.user.firstName} ${c.trainer?.user.lastName}`,
        confirmed: c.confirmed,
        declineReason: c.declineReason,
        confirmedAt: c.confirmedAt?.toISOString(),
        groupId: c.trainingGroupId,
        groupName: c.trainingGroup?.name,
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
