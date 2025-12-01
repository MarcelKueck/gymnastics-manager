import { NextRequest, NextResponse } from 'next/server';
import { requireAthlete } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';

// GET - Get athlete profile
export async function GET() {
  const { session, error } = await requireAthlete();
  if (error) return error;

  const athleteId = session!.user.athleteProfileId!;

  try {
    const athlete = await prisma.athleteProfile.findUnique({
      where: { id: athleteId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            birthDate: true,
          },
        },
      },
    });

    if (!athlete) {
      return NextResponse.json(
        { error: 'Athletenprofil nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        firstName: athlete.user.firstName,
        lastName: athlete.user.lastName,
        email: athlete.user.email,
        birthDate: athlete.user.birthDate?.toISOString(),
        phone: athlete.user.phone,
      },
    });
  } catch (err) {
    console.error('Profile GET error:', err);
    return NextResponse.json(
      { error: 'Fehler beim Laden des Profils' },
      { status: 500 }
    );
  }
}

// PUT - Update athlete profile
export async function PUT(request: NextRequest) {
  const { session, error } = await requireAthlete();
  if (error) return error;

  const userId = session!.user.id;

  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, birthDate } = body;

    // Update user data
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email,
        phone,
        birthDate: birthDate ? new Date(birthDate) : null,
      },
    });

    return NextResponse.json({
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        birthDate: user.birthDate?.toISOString(),
        phone: user.phone,
      },
      message: 'Profil aktualisiert',
    });
  } catch (err) {
    console.error('Profile PUT error:', err);
    return NextResponse.json(
      { error: 'Fehler beim Speichern des Profils' },
      { status: 500 }
    );
  }
}
