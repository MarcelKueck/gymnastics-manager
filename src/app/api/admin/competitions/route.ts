import { requireAdmin } from '@/lib/api/authHelpers';
import { competitionService } from '@/lib/services/competitionService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse, messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';
import { YouthCategory } from '@prisma/client';

const createCompetitionSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  date: z.string().min(1, 'Datum ist erforderlich'),
  location: z.string().min(1, 'Ort ist erforderlich'),
  description: z.string().optional(),
  minYouthCategory: z.nativeEnum(YouthCategory).optional(),
  maxYouthCategory: z.nativeEnum(YouthCategory).optional(),
  registrationDeadline: z.string().optional(),
  maxParticipants: z.number().int().positive().optional(),
  requiresDtbId: z.boolean().optional(),
  entryFee: z.number().nonnegative().optional(),
  isPublished: z.boolean().optional(),
});

export const GET = asyncHandler(async (request: Request) => {
  await requireAdmin();
  const { searchParams } = new URL(request.url);

  const upcoming = searchParams.get('upcoming') === 'true';
  const published = searchParams.get('published');

  const competitions = await competitionService.getAllCompetitions({
    upcoming,
    published: published === 'true' ? true : published === 'false' ? false : undefined,
  });

  return successResponse(competitions);
});

export const POST = asyncHandler(async (request: Request) => {
  const session = await requireAdmin();
  const body = await request.json();

  const validatedData = createCompetitionSchema.parse(body);

  const competition = await competitionService.createCompetition(
    session.user.trainerProfileId!,
    {
      name: validatedData.name,
      date: new Date(validatedData.date),
      location: validatedData.location,
      description: validatedData.description,
      minYouthCategory: validatedData.minYouthCategory,
      maxYouthCategory: validatedData.maxYouthCategory,
      registrationDeadline: validatedData.registrationDeadline
        ? new Date(validatedData.registrationDeadline)
        : undefined,
      maxParticipants: validatedData.maxParticipants,
      requiresDtbId: validatedData.requiresDtbId ?? false,
      entryFee: validatedData.entryFee,
      isPublished: validatedData.isPublished ?? false,
    }
  );

  return successResponse(competition);
});
