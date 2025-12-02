import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseVirtualSessionId } from '@/lib/sessions/virtual-sessions';

// POST - Mark trainer attendance (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    // Only admins can mark trainer attendance
    if (session.user.activeRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Nur Admins können Trainer-Anwesenheit markieren' }, { status: 403 });
    }

    const body = await request.json();
    let { sessionId } = body;
    const { attendance } = body;

    if (!sessionId || !attendance || !Array.isArray(attendance)) {
      return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
    }

    // Get admin's trainer profile (they might have ADMIN role or just be a TRAINER with admin activeRole)
    let adminProfile = await prisma.trainerProfile.findFirst({
      where: { userId: session.user.id, role: 'ADMIN' },
    });

    // If not found with ADMIN role, try to find any trainer profile for this user
    if (!adminProfile) {
      adminProfile = await prisma.trainerProfile.findFirst({
        where: { userId: session.user.id },
      });
    }

    if (!adminProfile) {
      return NextResponse.json({ error: 'Trainer-Profil nicht gefunden. Bitte wenden Sie sich an den Administrator.' }, { status: 404 });
    }

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
        sessionId = existingSession.id;
      } else {
        // Get recurring training details
        const recurringTraining = await prisma.recurringTraining.findUnique({
          where: { id: virtualInfo.recurringTrainingId },
        });

        if (!recurringTraining) {
          return NextResponse.json({ error: 'Wiederkehrendes Training nicht gefunden' }, { status: 404 });
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
        sessionId = newSession.id;
      }
    }

    // Upsert attendance records for each trainer
    const results = await Promise.all(
      attendance.map(async (record: { trainerId: string; status: string; notes?: string }) => {
        if (!record.trainerId || !record.status) {
          return null;
        }

        // Check if record exists
        const existing = await prisma.trainerAttendanceRecord.findUnique({
          where: {
            trainerId_trainingSessionId: {
              trainerId: record.trainerId,
              trainingSessionId: sessionId,
            },
          },
        });

        if (existing) {
          // Update existing record
          return prisma.trainerAttendanceRecord.update({
            where: { id: existing.id },
            data: {
              status: record.status as 'PRESENT' | 'ABSENT_UNEXCUSED' | 'ABSENT_EXCUSED',
              notes: record.notes || null,
              lastModifiedBy: adminProfile.id,
              lastModifiedAt: new Date(),
            },
          });
        } else {
          // Create new record
          return prisma.trainerAttendanceRecord.create({
            data: {
              trainerId: record.trainerId,
              trainingSessionId: sessionId,
              status: record.status as 'PRESENT' | 'ABSENT_UNEXCUSED' | 'ABSENT_EXCUSED',
              markedBy: adminProfile.id,
              notes: record.notes || null,
            },
          });
        }
      })
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Trainer-Anwesenheit gespeichert',
      count: results.filter(Boolean).length,
    });
  } catch (error) {
    console.error('Trainer attendance API error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Trainer-Anwesenheit' },
      { status: 500 }
    );
  }
}

// GET - Get trainer attendance for a session
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
    }

    if (session.user.activeRole !== 'ADMIN' && session.user.activeRole !== 'TRAINER') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session-ID erforderlich' }, { status: 400 });
    }

    const records = await prisma.trainerAttendanceRecord.findMany({
      where: { trainingSessionId: sessionId },
      include: {
        trainer: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      data: records.map((r) => ({
        id: r.id,
        trainerId: r.trainerId,
        trainerName: `${r.trainer.user.firstName} ${r.trainer.user.lastName}`,
        status: r.status,
        notes: r.notes,
        markedAt: r.markedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Trainer attendance GET error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Trainer-Anwesenheit' },
      { status: 500 }
    );
  }
}
