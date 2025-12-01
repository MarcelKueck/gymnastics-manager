import { NextResponse } from "next/server";
import { requireAthlete } from "@/lib/api/auth";
import { competitionService } from "@/lib/services/competitionService";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAthlete();
  if (error) return error;

  try {
    const registration = await competitionService.registerAthlete(
      params.id,
      session!.user.athleteProfileId!
    );
    return NextResponse.json(registration, { status: 201 });
  } catch (err) {
    console.error("Error registering for competition:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fehler bei der Anmeldung" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAthlete();
  if (error) return error;

  try {
    await competitionService.unregisterAthlete(
      params.id,
      session!.user.athleteProfileId!
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error unregistering from competition:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fehler beim Abmelden" },
      { status: 400 }
    );
  }
}
