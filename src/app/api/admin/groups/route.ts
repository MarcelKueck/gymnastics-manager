import { requireAdmin } from '@/lib/api/authHelpers';
import { trainingService } from '@/lib/services/trainingService';
import { successResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const createGroupSchema = z.object({
  recurringTrainingId: z.string().min(1, 'Training ID erforderlich'),
  name: z.string().min(1, 'Name erforderlich'),
  sortOrder: z.number().optional(),
});

/**
 * GET /api/admin/groups
 * Fetch all training groups
 */
export async function GET() {
  try {
    await requireAdmin();

    const groups = await prisma.trainingGroup.findMany({
      include: {
        recurringTraining: {
          select: {
            name: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
          },
        },
        athleteAssignments: {
          select: {
            athleteId: true,
          },
        },
        trainerAssignments: {
          select: {
            trainerId: true,
          },
        },
      },
      orderBy: [
        { recurringTraining: { name: 'asc' } },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    return successResponse(groups);
  } catch (error) {
    const { handleApiError } = await import('@/lib/api/errorHandlers');
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/groups
 * Create a new training group
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();

    const validatedData = createGroupSchema.parse(body);

    const group = await trainingService.createTrainingGroup(
      validatedData.recurringTrainingId,
      validatedData.name,
      validatedData.sortOrder
    );

    return successResponse(group, 201);
  } catch (error) {
    const { handleApiError } = await import('@/lib/api/errorHandlers');
    return handleApiError(error);
  }
}
