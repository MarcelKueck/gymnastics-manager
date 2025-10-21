// Save as: src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { calculateYouthCategory } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      firstName,
      lastName,
      birthDate,
      gender,
      email,
      password,
      phone,
      guardianName,
      guardianEmail,
      guardianPhone,
      emergencyContactName,
      emergencyContactPhone,
    } = body;

    // Validation
    if (!firstName || !lastName || !birthDate || !gender || !email || !password || !phone) {
      return NextResponse.json(
        { message: "Alle Pflichtfelder müssen ausgefüllt werden" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingAthlete = await prisma.athlete.findUnique({
      where: { email },
    });

    if (existingAthlete) {
      return NextResponse.json(
        { message: "E-Mail-Adresse bereits registriert" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Calculate youth category from birth date
    const birthDateObj = new Date(birthDate);
    const youthCategory = calculateYouthCategory(birthDateObj);

    // Create athlete account
    // CRITICAL: isApproved = false, coach must approve and configure training
    const athlete = await prisma.athlete.create({
      data: {
        firstName,
        lastName,
        birthDate: birthDateObj,
        gender,
        email,
        passwordHash,
        phone,
        guardianName: guardianName || null,
        guardianEmail: guardianEmail || null,
        guardianPhone: guardianPhone || null,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
        youthCategory,
        isApproved: false, // Pending coach approval
        competitionParticipation: false, // Default, coach will set
        autoConfirmFutureSessions: false, // Default
      },
    });

    // Send registration confirmation email
    const { sendAthleteRegistrationEmail } = await import('@/lib/email');
    try {
      await sendAthleteRegistrationEmail({
        athleteEmail: athlete.email,
        guardianEmail: athlete.guardianEmail,
        athleteName: `${athlete.firstName} ${athlete.lastName}`,
      });
      console.log('✅ Registration confirmation email sent');
    } catch (emailError) {
      console.error('❌ Failed to send registration confirmation email:', emailError);
      // Don't fail the registration if email fails
    }

    return NextResponse.json(
      {
        message: "Registrierung erfolgreich",
        athleteId: athlete.id,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Fehler bei der Registrierung" },
      { status: 500 }
    );
  }
}