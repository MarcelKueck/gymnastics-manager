import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only trainers and admins can mark attendance
    if (session.user.role !== 'TRAINER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { sessionId, attendance } = body;

    if (!sessionId || !Array.isArray(attendance)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Process each attendance record
    await Promise.all(
      attendance.map(async (record: { athleteId: string; status: 'PRESENT' | 'ABSENT_UNEXCUSED' | 'ABSENT_EXCUSED' }) => {
        const existingRecord = await prisma.attendanceRecord.findUnique({
          where: {
            athleteId_trainingSessionId: {
              athleteId: record.athleteId,
              trainingSessionId: sessionId,
            },
          },
        });

        if (existingRecord) {
          // Update existing record
          await prisma.attendanceRecord.update({
            where: { id: existingRecord.id },
            data: {
              status: record.status,
              lastModifiedBy: session.user.id,
              lastModifiedAt: new Date(),
            },
          });
        } else {
          // Create new record
          await prisma.attendanceRecord.create({
            data: {
              trainingSessionId: sessionId,
              athleteId: record.athleteId,
              status: record.status,
              markedBy: session.user.id,
            },
          });
        }
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json(
      { error: 'Failed to update attendance' },
      { status: 500 }
    );
  }
}
