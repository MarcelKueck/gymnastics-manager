import { requireAdmin } from '@/lib/api/authHelpers';
import { settingsService } from '@/lib/services/settingsService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse, messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  cancellationDeadlineHours: z.number().int().min(0).max(48).optional(),
  absenceAlertThreshold: z.number().int().min(1).max(10).optional(),
  absenceAlertWindowDays: z.number().int().min(7).max(90).optional(),
  absenceAlertCooldownDays: z.number().int().min(1).max(60).optional(),
  adminNotificationEmail: z.string().email().optional(),
  absenceAlertEnabled: z.boolean().optional(),
  maxUploadSizeMB: z.number().int().min(1).max(100).optional(),
  sessionGenerationDaysAhead: z.number().int().min(30).max(365).optional(),
});

export const GET = asyncHandler(async (request: Request) => {
  await requireAdmin();

  const settings = await settingsService.getSettings();

  return successResponse(settings);
});

export const PUT = asyncHandler(async (request: Request) => {
  const session = await requireAdmin();
  const body = await request.json();

  const validatedData = updateSettingsSchema.parse(body);

  const settings = await settingsService.updateSettings(validatedData, session.user.id);

  return successResponse(settings);
});
