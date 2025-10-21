import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Only admins can view pending athletes
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const athletes = await prisma.athlete.findMany({
      where: {
        isApproved: false,
      },
      orderBy: {
        createdAt: 'asc',
      },
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
        createdAt: true,
      },
    });

    return NextResponse.json({ athletes });
  } catch (error) {
    console.error('Get pending athletes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending athletes' },
      { status: 500 }
    );
  }
}
