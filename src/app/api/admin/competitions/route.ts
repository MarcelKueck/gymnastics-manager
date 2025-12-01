import { NextResponse } from "next/server";
import { requireTrainer } from "@/lib/api/auth";
import { competitionService } from "@/lib/services/competitionService";

export async function GET() {
  const { error } = await requireTrainer();
  if (error) return error;

  try {
    const competitions = await competitionService.getAllCompetitions(true);
    return NextResponse.json(competitions);
  } catch (err) {
    console.error("Error fetching competitions:", err);
    return NextResponse.json(
      { error: "Fehler beim Laden der Wettkämpfe" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireTrainer();
  if (error) return error;

  try {
    const body = await request.json();
    const competition = await competitionService.createCompetition(
      body,
      session!.user.trainerProfileId!
    );
    return NextResponse.json(competition, { status: 201 });
  } catch (err) {
    console.error("Error creating competition:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fehler beim Erstellen" },
      { status: 500 }
    );
  }
}
