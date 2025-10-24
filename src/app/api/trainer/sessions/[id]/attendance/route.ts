import { requireTrainer } from '@/lib/api/authHelpers';
import { attendanceService } from '@/lib/services/attendanceService';
import { asyncHandler } from '@/lib/api/errorHandlers';
import { successResponse, messageResponse } from '@/lib/api/responseHelpers';
import { z } from 'zod';
import { AttendanceStatus } from '@prisma/client';

const markAttendanceSchema = z.object({
  records: z.array(
    z.object({
      athleteId: z.string().min(1),
      status: z.nativeEnum(AttendanceStatus),
      notes: z.string().optional(),
    })
  ),
});

export const GET = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    await requireTrainer();

    const attendance = await attendanceService.getSessionAttendance(params.id);

    return successResponse(attendance);
  }
);

export const POST = asyncHandler(
  async (request: Request, { params }: { params: { id: string } }) => {
    const session = await requireTrainer();
    const body = await request.json();

    const validatedData = markAttendanceSchema.parse(body);

    // Add trainingSessionId from URL params to each record
    const recordsWithSessionId = validatedData.records.map((record) => ({
      ...record,
      trainingSessionId: params.id,
    }));

    await attendanceService.bulkMarkAttendance(recordsWithSessionId, session.user.id);

    return messageResponse('Anwesenheit erfolgreich gespeichert', 201);
  }
);