import { requireTrainer } from '@/lib/api/authHelpers';
import { athleteService } from '@/lib/services/athleteService';
import { sendAthleteApprovalEmail } from '@/lib/email';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';
import { YouthCategory } from '@prisma/client';

const approvalSchema = z.object({
  youthCategory: z.nativeEnum(YouthCategory),
  competitionParticipation: z.boolean(),
  hasDtbId: z.boolean(),
  trainingGroupIds: z.array(z.string().min(1)).min(1, 'Mindestens eine Gruppe erforderlich'),
});

export const POST = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    const session = await requireTrainer();
    const body = await request.json();

    const validatedData = approvalSchema.parse(body);

    const athleteProfile = await athleteService.approveAndConfigure(
      params.id,
      session.user.id,
      validatedData
    );

    // Send approval email
    await sendAthleteApprovalEmail(
      athleteProfile.user.email, 
      `${athleteProfile.user.firstName} ${athleteProfile.user.lastName}`
    );

    return messageResponse('Athlet erfolgreich genehmigt', 200);
  }
);