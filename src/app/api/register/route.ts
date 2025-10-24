import { athleteRegistrationSchema } from '@/lib/validation/auth';
import { athleteService } from '@/lib/services/athleteService';
import { sendNewRegistrationNotification } from '@/lib/email';
import { handleApiError } from '@/lib/api/errorHandlers';
import { successResponse } from '@/lib/api/responseHelpers';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = athleteRegistrationSchema.parse(body);

    // Register athlete
    const athlete = await athleteService.register({
      email: validatedData.email,
      password: validatedData.password,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      birthDate: new Date(validatedData.birthDate),
      gender: validatedData.gender,
      phone: validatedData.phone,
      guardianName: validatedData.guardianName,
      guardianEmail: validatedData.guardianEmail,
      guardianPhone: validatedData.guardianPhone,
      emergencyContactName: validatedData.emergencyContactName,
      emergencyContactPhone: validatedData.emergencyContactPhone,
    });

    // Send notification to admins
    await sendNewRegistrationNotification(
      `${athlete.firstName} ${athlete.lastName}`,
      athlete.email
    );

    return successResponse(
      {
        message:
          'Registrierung erfolgreich! Dein Account wird geprüft und du erhältst eine E-Mail, sobald er genehmigt wurde.',
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}