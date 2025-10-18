import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get athlete profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ATHLETE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const athlete = await prisma.athlete.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        gender: true,
        phone: true,
        guardianName: true,
        guardianEmail: true,
        guardianPhone: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        youthCategory: true,
        competitionParticipation: true,
        autoConfirmFutureSessions: true,
        isApproved: true,
        approvedAt: true,
        groupAssignments: {
          where: { isActive: true },
          select: {
            trainingDay: true,
            hourNumber: true,
            groupNumber: true,
          },
        },
      },
    });

    if (!athlete) {
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    return NextResponse.json({ athlete });
  } catch (error) {
    console.error('Get profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update editable profile fields (contact info only)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== 'ATHLETE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      email,
      phone,
      guardianName,
      guardianEmail,
      guardianPhone,
      emergencyContactName,
      emergencyContactPhone,
    } = body;

    // Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    if (email && email !== session.user.email) {
      const existingUser = await prisma.athlete.findFirst({
        where: {
          email,
          id: { not: session.user.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    // Update only editable fields
    const updatedAthlete = await prisma.athlete.update({
      where: { id: session.user.id },
      data: {
        email: email || undefined,
        phone: phone || undefined,
        guardianName: guardianName || null,
        guardianEmail: guardianEmail || null,
        guardianPhone: guardianPhone || null,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
      },
      select: {
        email: true,
        phone: true,
        guardianName: true,
        guardianEmail: true,
        guardianPhone: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
      },
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      athlete: updatedAthlete,
    });
  } catch (error) {
    console.error('Update profile API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}