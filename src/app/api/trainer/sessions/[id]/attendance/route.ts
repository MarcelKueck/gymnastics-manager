import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AttendanceStatus } from '@prisma/client';
import { parseVirtualSessionId } from '@/lib/sessions/virtual-sessions';
import { checkAndTriggerAbsenceAlert } from '@/lib/services/absenceAlertService';

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
    const body = await request.json();
    const { records } = body as {
      records: Array<{
        athleteId: string;
        status: AttendanceStatus;
        note?: string;
      }>;
    };

    if (!records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Ungültige Daten' }, { status: 400 });
    }

    let sessionId = id;
    
    // Check if this is a virtual session ID - if so, create the real session first
    const virtualInfo = parseVirtualSessionId(id);
    
    if (virtualInfo) {
      // Get recurring training to get day/time info
      const recurringTraining = await prisma.recurringTraining.findUnique({
        where: { id: virtualInfo.recurringTrainingId },
      });

      if (!recurringTraining) {
        return NextResponse.json({ error: 'Training nicht gefunden' }, { status: 404 });
      }

      // Check if session already exists (might have been created by another request)
      let trainingSession = await prisma.trainingSession.findFirst({
        where: {
          recurringTrainingId: virtualInfo.recurringTrainingId,
          date: virtualInfo.date,
        },
      });

      if (!trainingSession) {
        // Create the session record
        trainingSession = await prisma.trainingSession.create({
          data: {
            recurringTrainingId: virtualInfo.recurringTrainingId,
            date: virtualInfo.date,
            dayOfWeek: recurringTraining.dayOfWeek,
            startTime: recurringTraining.startTime,
            endTime: recurringTraining.endTime,
          },
        });
      }

      sessionId = trainingSession.id;
    } else {
      // Verify session exists
      const trainingSession = await prisma.trainingSession.findUnique({
        where: { id },
      });

      if (!trainingSession) {
        return NextResponse.json({ error: 'Trainingseinheit nicht gefunden' }, { status: 404 });
      }
    }

    // Get the trainer profile for the current user
    const trainerProfile = await prisma.trainerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!trainerProfile) {
      return NextResponse.json({ error: 'Trainer-Profil nicht gefunden' }, { status: 404 });
    }

    // Upsert attendance records
    const upsertPromises = records.map((record) =>
      prisma.attendanceRecord.upsert({
        where: {
          athleteId_trainingSessionId: {
            trainingSessionId: sessionId,
            athleteId: record.athleteId,
          },
        },
        create: {
          trainingSessionId: sessionId,
          athleteId: record.athleteId,
          status: record.status,
          notes: record.note,
          markedBy: trainerProfile.id,
        },
        update: {
          status: record.status,
          notes: record.note,
          markedBy: trainerProfile.id,
          markedAt: new Date(),
        },
      })
    );

    await Promise.all(upsertPromises);

    // Check for absence alerts for athletes marked as unexcused absent
    // This uses the proper service with configurable settings and email notifications
    for (const record of records) {
      if (record.status === 'ABSENT_UNEXCUSED') {
        await checkAndTriggerAbsenceAlert(record.athleteId);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Anwesenheit erfolgreich gespeichert',
    });
  } catch (error) {
    console.error('Attendance API error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Anwesenheit' },
      { status: 500 }
    );
  }
}
