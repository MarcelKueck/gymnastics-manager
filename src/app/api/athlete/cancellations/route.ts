import { requireAthlete } from '@/lib/api/authHelpers';
import { attendanceService } from '@/lib/services/attendanceService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse, messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const createCancellationSchema = z.object({
  trainingSessionId: z.string().min(1),
  reason: z.string().min(10, 'Grund muss mindestens 10 Zeichen lang sein'),
});

const bulkCancellationSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().min(10, 'Grund muss mindestens 10 Zeichen lang sein'),
  recurringTrainingIds: z.array(z.string().min(1)).optional(), // Optional: filter by specific trainings
});

export const GET = asyncHandler(async (request: Request) => {
  const session = await requireAthlete();

  const cancellations = await attendanceService.getActiveCancellations(session.user.id);

  return successResponse(cancellations);
});

export const POST = asyncHandler(async (request: Request) => {
  const session = await requireAthlete();
  const body = await request.json();
  const { searchParams } = new URL(request.url);
  const bulk = searchParams.get('bulk') === 'true';

  if (bulk) {
    // Bulk cancellation for date range
    const validatedData = bulkCancellationSchema.parse(body);
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    // Get athlete's sessions in the date range
    const sessions = await prisma.trainingSession.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        OR: [
          {
            groups: {
              some: {
                trainingGroup: {
                  athleteAssignments: {
                    some: { athleteId: session.user.id },
                  },
                },
              },
            },
          },
          {
            sessionAthleteAssignments: {
              some: { athleteId: session.user.id },
            },
          },
        ],
        ...(validatedData.recurringTrainingIds && validatedData.recurringTrainingIds.length > 0
          ? { recurringTrainingId: { in: validatedData.recurringTrainingIds } }
          : {}),
      },
      include: {
        cancellations: {
          where: {
            athleteId: session.user.id,
            isActive: true,
          },
        },
      },
    });

    // Filter out already cancelled sessions and sessions in the past
    const now = new Date();
    const sessionsToCancel = sessions.filter(
      (s) => s.date >= now && s.cancellations.length === 0
    );

    // Create cancellations for all sessions
    const cancellations = await Promise.all(
      sessionsToCancel.map((s) =>
        attendanceService.createCancellation(session.user.id, s.id, validatedData.reason)
      )
    );

    return messageResponse(
      `${cancellations.length} Trainingseinheiten erfolgreich abgesagt`,
      201
    );
  } else {
    // Single cancellation
    const validatedData = createCancellationSchema.parse(body);

    await attendanceService.createCancellation(
      session.user.id,
      validatedData.trainingSessionId,
      validatedData.reason
    );

    return messageResponse('Absage erfolgreich erstellt', 201);
  }
});