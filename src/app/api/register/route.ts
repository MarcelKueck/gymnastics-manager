import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      userType,
      firstName,
      lastName,
      email,
      password,
      phone,
      birthDate,
      gender,
      guardianName,
      guardianEmail,
      guardianPhone,
      emergencyContactName,
      emergencyContactPhone,
    } = body;

    // Validation
    if (!userType || !firstName || !lastName || !email || !password || !phone) {
      return NextResponse.json(
        { error: "Alle Pflichtfelder müssen ausgefüllt werden" },
        { status: 400 }
      );
    }

    // Additional validation for athletes
    if (userType === 'athlete') {
      if (!birthDate || !gender) {
        return NextResponse.json(
          { error: "Geburtsdatum und Geschlecht sind für Athleten erforderlich" },
          { status: 400 }
        );
      }
    }

    // Check if email already exists in either table
    const existingAthlete = await prisma.athlete.findUnique({
      where: { email },
    });

    const existingTrainer = await prisma.trainer.findUnique({
      where: { email },
    });

    if (existingAthlete || existingTrainer) {
      return NextResponse.json(
        { error: "E-Mail-Adresse bereits registriert" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    if (userType === 'athlete') {
      // Create athlete account
      const athlete = await prisma.athlete.create({
        data: {
          firstName,
          lastName,
          email,
          passwordHash,
          phone,
          birthDate: new Date(birthDate),
          gender,
          guardianName: guardianName || null,
          guardianEmail: guardianEmail || null,
          guardianPhone: guardianPhone || null,
          emergencyContactName: emergencyContactName || null,
          emergencyContactPhone: emergencyContactPhone || null,
          isApproved: false, // Pending trainer approval
          youthCategory: 'F', // Default, trainer will update
          competitionParticipation: false,
          autoConfirmFutureSessions: false,
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
          message: "Registrierung erfolgreich. Dein Account muss noch von einem Trainer freigeschaltet werden.",
          userId: athlete.id,
          userType: 'athlete',
        },
        { status: 201 }
      );
    } else if (userType === 'trainer') {
      // Create trainer account (pending admin approval)
      const trainer = await prisma.trainer.create({
        data: {
          firstName,
          lastName,
          email,
          passwordHash,
          phone,
          role: 'TRAINER', // Default role, admin can change
          isActive: false, // Pending admin approval - IMPORTANT!
        },
      });

      // Send registration confirmation email
      const { sendTrainerRegistrationEmail } = await import('@/lib/email');
      try {
        await sendTrainerRegistrationEmail({
          trainerEmail: trainer.email,
          trainerName: `${trainer.firstName} ${trainer.lastName}`,
        });
        console.log('✅ Trainer registration confirmation email sent');
      } catch (emailError) {
        console.error('❌ Failed to send trainer registration confirmation email:', emailError);
        // Don't fail the registration if email fails
      }

      return NextResponse.json(
        {
          message: "Registrierung erfolgreich. Dein Account muss noch von einem Administrator freigeschaltet werden.",
          userId: trainer.id,
          userType: 'trainer',
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { error: "Ungültiger Benutzertyp" },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Fehler bei der Registrierung" },
      { status: 500 }
    );
  }
}
