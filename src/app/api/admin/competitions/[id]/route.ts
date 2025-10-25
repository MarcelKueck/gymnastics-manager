import { requireAdmin } from '@/lib/api/authHelpers';
import { competitionService } from '@/lib/services/competitionService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse, messageResponse, errorResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';
import { YouthCategory } from '@prisma/client';

const updateCompetitionSchema = z.object({
  name: z.string().min(1).optional(),
  date: z.string().optional(),
  location: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  minYouthCategory: z.nativeEnum(YouthCategory).optional().nullable(),
  maxYouthCategory: z.nativeEnum(YouthCategory).optional().nullable(),
  registrationDeadline: z.string().optional().nullable(),
  maxParticipants: z.number().int().positive().optional().nullable(),
  requiresDtbId: z.boolean().optional(),
  entryFee: z.number().nonnegative().optional().nullable(),
  isPublished: z.boolean().optional(),
  isCancelled: z.boolean().optional(),
});

export const GET = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireAdmin();

    const competition = await competitionService.getCompetitionById(params.id);

    if (!competition) {
      return errorResponse('Wettkampf nicht gefunden', 404);
    }

    return successResponse(competition);
  }
);

export const PUT = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireAdmin();
    const body = await request.json();

    const validatedData = updateCompetitionSchema.parse(body);

    const updateData: any = {};

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.date !== undefined) updateData.date = new Date(validatedData.date);
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.minYouthCategory !== undefined)
      updateData.minYouthCategory = validatedData.minYouthCategory;
    if (validatedData.maxYouthCategory !== undefined)
      updateData.maxYouthCategory = validatedData.maxYouthCategory;
    if (validatedData.registrationDeadline !== undefined)
      updateData.registrationDeadline = validatedData.registrationDeadline
        ? new Date(validatedData.registrationDeadline)
        : null;
    if (validatedData.maxParticipants !== undefined)
      updateData.maxParticipants = validatedData.maxParticipants;
    if (validatedData.requiresDtbId !== undefined)
      updateData.requiresDtbId = validatedData.requiresDtbId;
    if (validatedData.entryFee !== undefined) updateData.entryFee = validatedData.entryFee;
    if (validatedData.isPublished !== undefined) updateData.isPublished = validatedData.isPublished;
    if (validatedData.isCancelled !== undefined) updateData.isCancelled = validatedData.isCancelled;

    const competition = await competitionService.updateCompetition(params.id, updateData);

    return successResponse(competition);
  }
);

export const DELETE = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireAdmin();

    await competitionService.deleteCompetition(params.id);

    return messageResponse('Wettkampf erfolgreich gelöscht');
  }
);
