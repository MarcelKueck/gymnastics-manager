import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: planId } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get plan details
    const plan = await prisma.trainingPlan.findUnique({
      where: { id: planId, isActive: true },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Read file
    const fullPath = join(process.cwd(), 'public', plan.filePath);
    const fileBuffer = await readFile(fullPath);

    // Return file
    return new NextResponse(fileBuffer as any, {
      headers: {
        'Content-Type': plan.mimeType,
        'Content-Disposition': `attachment; filename="${plan.fileName}"`,
        'Content-Length': plan.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error('Download training plan error:', error);
    return NextResponse.json(
      { error: 'Failed to download training plan' },
      { status: 500 }
    );
  }
}