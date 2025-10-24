import { requireTrainer } from '@/lib/api/authHelpers';
import { sessionService } from '@/lib/services/sessionService';
import { trainingService } from '@/lib/services/trainingService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse } from '@/lib/api/responseHelpers';
import { addDays } from 'date-fns';
import { ROLES } from '@/lib/constants/roles';

export const GET = asyncHandler(async (request: Request) => {
  const session = await requireTrainer();
  const { searchParams } = new URL(request.url);

  const startDate = searchParams.get('startDate')
    ? new Date(searchParams.get('startDate')!)
    : new Date();
  const endDate = searchParams.get('endDate')
    ? new Date(searchParams.get('endDate')!)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Auto-generate sessions if they don't exist yet
  // Generate sessions up to 30 days beyond the requested end date to ensure smooth scrolling
  const generateUntil = addDays(endDate, 30);
  const daysAhead = Math.ceil((generateUntil.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  await trainingService.generateSessions(daysAhead);

  // Admins see all sessions, trainers only see sessions they're assigned to
  const sessions = session.user.activeRole === ROLES.ADMIN
    ? await sessionService.getSessionsInRange(startDate, endDate)
    : await sessionService.getTrainersSessions(session.user.id, startDate, endDate);

  return successResponse(sessions);
});