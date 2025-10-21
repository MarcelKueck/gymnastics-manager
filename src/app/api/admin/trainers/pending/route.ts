import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Only admins can view pending trainers
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trainers = await prisma.trainer.findMany({
      where: {
        isActive: false,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ trainers });
  } catch (error) {
    console.error('Get pending trainers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending trainers' },
      { status: 500 }
    );
  }
}
