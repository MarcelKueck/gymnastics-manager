import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active uploads (available to all authenticated users)
    const uploads = await prisma.upload.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
            sortOrder: true,
          },
        },
        title: true,
        targetDate: true,
        fileName: true,
        fileSize: true,
        uploadedAt: true,
      },
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { uploadedAt: 'desc' },
      ],
    });

    return NextResponse.json({ uploads });
  } catch (error) {
    console.error('Get uploads error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch uploads' },
      { status: 500 }
    );
  }
}