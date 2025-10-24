import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/authHelpers';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const createAthleteSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z.string(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phone: z.string(),
  guardianName: z.string().optional(),
  guardianEmail: z.string().email().optional().or(z.literal('')),
  guardianPhone: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  isApproved: z.boolean().default(true), // Admin-created athletes are auto-approved
});

export async function GET() {
  try {
    const session = await requireAdmin();

    const athletes = await prisma.athlete.findMany({
      orderBy: [
        { isApproved: 'desc' },
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
      include: {
        _count: {
          select: {
            attendanceRecords: true,
            cancellations: true,
            absenceAlerts: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: athletes,
    });
  } catch (error) {
    console.error('Error fetching athletes:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = await request.json();

    const validatedData = createAthleteSchema.parse(body);

    // Check if email already exists
    const existingAthlete = await prisma.athlete.findUnique({
      where: { email: validatedData.email },
    });

    if (existingAthlete) {
      return NextResponse.json(
        { success: false, error: 'Ein Athlet mit dieser E-Mail existiert bereits' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    // Create athlete
    const athlete = await prisma.athlete.create({
      data: {
        email: validatedData.email,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        birthDate: new Date(validatedData.birthDate),
        gender: validatedData.gender,
        phone: validatedData.phone,
        guardianName: validatedData.guardianName,
        guardianEmail: validatedData.guardianEmail || null,
        guardianPhone: validatedData.guardianPhone,
        emergencyContactName: validatedData.emergencyContactName,
        emergencyContactPhone: validatedData.emergencyContactPhone,
        isApproved: true,
        approvedBy: session.user.id,
        approvedAt: new Date(),
        configuredAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: athlete,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Ungültige Eingabedaten', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating athlete:', error);
    return NextResponse.json(
      { success: false, error: 'Fehler beim Erstellen des Athleten' },
      { status: 500 }
    );
  }
}
