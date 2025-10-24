import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api/authHelpers';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await requireAdmin();
    const { id: athleteId } = context.params;

    // Get absence alerts for this athlete
    const absenceAlerts = await prisma.absenceAlert.findMany({
      where: {
        athleteId,
      },
      orderBy: {
        sentAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: absenceAlerts,
    });
  } catch (error) {
    console.error('Error fetching absence alerts:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await requireAdmin();
    const { id: athleteId } = context.params;

    // Delete all absence alerts for this athlete
    await prisma.absenceAlert.deleteMany({
      where: {
        athleteId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Absence alerts reset successfully',
    });
  } catch (error) {
    console.error('Error resetting absence alerts:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
