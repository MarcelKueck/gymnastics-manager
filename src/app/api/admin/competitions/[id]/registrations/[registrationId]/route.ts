import { NextResponse } from "next/server";
import { requireTrainer } from "@/lib/api/auth";
import { competitionService } from "@/lib/services/competitionService";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; registrationId: string } }
) {
  const { error } = await requireTrainer();
  if (error) return error;

  try {
    const body = await request.json();
    const registration = await competitionService.updateRegistration(
      params.id,
      params.registrationId, // This is the athleteId
      body
    );
    return NextResponse.json(registration);
  } catch (err) {
    console.error("Error updating registration:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fehler beim Aktualisieren" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; registrationId: string } }
) {
  const { error } = await requireTrainer();
  if (error) return error;

  try {
    await competitionService.unregisterAthlete(params.id, params.registrationId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error removing registration:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fehler beim Entfernen" },
      { status: 500 }
    );
  }
}
