import { requireAthlete } from '@/lib/api/authHelpers';
import { attendanceService } from '@/lib/services/attendanceService';
import { settingsService } from '@/lib/services/settingsService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const updateCancellationSchema = z.object({
  reason: z.string().min(10, 'Grund muss mindestens 10 Zeichen lang sein'),
});

// Check if cancellation can be modified (deadline from settings)
async function canModifyCancellation(cancellationId: string, athleteId: string) {
  const cancellation = await prisma.cancellation.findUnique({
    where: { id: cancellationId },
    include: { trainingSession: true },
  });

  if (!cancellation) {
    throw new Error('Absage nicht gefunden');
  }

  if (cancellation.athleteId !== athleteId) {
    throw new Error('Keine Berechtigung');
  }

  if (!cancellation.isActive) {
    throw new Error('Diese Absage ist nicht mehr aktiv');
  }

  const session = cancellation.trainingSession;
  const sessionDateTime = new Date(session.date);
  const startTime = session.startTime || '00:00';
  const [hours, minutes] = startTime.split(':').map(Number);
  sessionDateTime.setHours(hours, minutes, 0, 0);

  // Get deadline from settings
  const deadlineHours = await settingsService.getCancellationDeadlineHours();
  const deadline = new Date(sessionDateTime.getTime() - deadlineHours * 60 * 60 * 1000);
  const now = new Date();

  if (now >= deadline) {
    throw new Error(
      `Absagen können nur bis ${deadlineHours} Stunden vor Trainingsbeginn bearbeitet werden`
    );
  }

  return cancellation;
}

export const PUT = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    const session = await requireAthlete();
    const body = await request.json();

    const validatedData = updateCancellationSchema.parse(body);

    // Verify modification is allowed
    await canModifyCancellation(params.id, session.user.id);

    // Update the cancellation reason
    await prisma.cancellation.update({
      where: { id: params.id },
      data: { reason: validatedData.reason },
    });

    return messageResponse('Absage erfolgreich aktualisiert');
  }
);

export const DELETE = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    const session = await requireAthlete();

    // Verify modification is allowed
    await canModifyCancellation(params.id, session.user.id);

    // Undo the cancellation
    await attendanceService.undoCancellation(params.id);

    return messageResponse('Absage erfolgreich rückgängig gemacht');
  }
);