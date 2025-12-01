import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registrationSchema } from '@/lib/validation/auth';
import { sendRegistrationNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = registrationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if email exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Diese E-Mail-Adresse ist bereits registriert' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user with athlete profile
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        gender: data.gender,
        isAthlete: true,
        athleteProfile: {
          create: {
            guardianName: data.guardianName || null,
            guardianEmail: data.guardianEmail || null,
            guardianPhone: data.guardianPhone || null,
            emergencyContactName: data.emergencyContactName || null,
            emergencyContactPhone: data.emergencyContactPhone || null,
            isApproved: false, // Requires trainer approval
          },
        },
      },
      include: {
        athleteProfile: true,
      },
    });

    // Send notification email to admins
    await sendRegistrationNotification({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      guardianName: data.guardianName,
      guardianEmail: data.guardianEmail,
    });

    return NextResponse.json({
      message: 'Registrierung erfolgreich. Ein Trainer wird Ihr Konto prüfen.',
      userId: user.id,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}
