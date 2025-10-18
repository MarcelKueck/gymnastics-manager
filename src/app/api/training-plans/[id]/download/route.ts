import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const planId = params.id;

    // Get training plan
    const trainingPlan = await prisma.trainingPlan.findUnique({
      where: { id: planId },
    });

    if (!trainingPlan) {
      return NextResponse.json(
        { error: 'Training plan not found' },
        { status: 404 }
      );
    }

    if (!trainingPlan.isActive) {
      return NextResponse.json(
        { error: 'Training plan is no longer active' },
        { status: 410 }
      );
    }

    try {
      // Read file from storage
      const filePath = join(process.cwd(), 'uploads', trainingPlan.filePath);
      const fileBuffer = await readFile(filePath);

      // Return file with appropriate headers
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': trainingPlan.mimeType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(
            trainingPlan.fileName
          )}"`,
          'Content-Length': trainingPlan.fileSize.toString(),
        },
      });
    } catch (fileError) {
      console.error('File read error:', fileError);
      return NextResponse.json(
        { error: 'File not found on server' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Download training plan API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}