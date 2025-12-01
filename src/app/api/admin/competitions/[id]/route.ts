import { NextResponse } from "next/server";
import { requireTrainer } from "@/lib/api/auth";
import { competitionService } from "@/lib/services/competitionService";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireTrainer();
  if (error) return error;

  try {
    const competition = await competitionService.getCompetitionById(params.id);
    if (!competition) {
      return NextResponse.json(
        { error: "Wettkampf nicht gefunden" },
        { status: 404 }
      );
    }
    return NextResponse.json(competition);
  } catch (err) {
    console.error("Error fetching competition:", err);
    return NextResponse.json(
      { error: "Fehler beim Laden des Wettkampfs" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireTrainer();
  if (error) return error;

  try {
    const body = await request.json();
    const competition = await competitionService.updateCompetition(
      params.id,
      body
    );
    return NextResponse.json(competition);
  } catch (err) {
    console.error("Error updating competition:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fehler beim Aktualisieren" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireTrainer();
  if (error) return error;

  try {
    await competitionService.deleteCompetition(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting competition:", err);
    return NextResponse.json(
      { error: "Fehler beim Löschen" },
      { status: 500 }
    );
  }
}
