import { requireTrainer } from '@/lib/api/authHelpers';
import { trainerService } from '@/lib/services/trainerService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Aktuelles Passwort erforderlich'),
  newPassword: z.string().min(8, 'Neues Passwort muss mindestens 8 Zeichen lang sein'),
});

export const POST = asyncHandler(async (request: Request) => {
  const session = await requireTrainer();
  const body = await request.json();

  const validatedData = changePasswordSchema.parse(body);

  await trainerService.changePassword(
    session.user.id,
    validatedData.currentPassword,
    validatedData.newPassword
  );

  return messageResponse('Passwort erfolgreich geändert');
});