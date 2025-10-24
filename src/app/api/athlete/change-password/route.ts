import { requireAthlete } from '@/lib/api/authHelpers';
import { athleteService } from '@/lib/services/athleteService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Aktuelles Passwort erforderlich'),
  newPassword: z.string().min(8, 'Neues Passwort muss mindestens 8 Zeichen lang sein'),
});

export const POST = asyncHandler(async (request: Request) => {
  const session = await requireAthlete();
  const body = await request.json();

  const validatedData = changePasswordSchema.parse(body);

  await athleteService.changePassword(
    session.user.id,
    validatedData.currentPassword,
    validatedData.newPassword
  );

  return messageResponse('Passwort erfolgreich geändert');
});