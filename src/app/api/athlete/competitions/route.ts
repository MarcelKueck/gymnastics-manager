import { NextResponse } from "next/server";
import { requireAthlete } from "@/lib/api/auth";
import { competitionService } from "@/lib/services/competitionService";

export async function GET(request: Request) {
  const { session, error } = await requireAthlete();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "upcoming";

  try {
    if (type === "past") {
      const competitions = await competitionService.getPastCompetitions(
        session!.user.athleteProfileId!
      );
      return NextResponse.json(competitions);
    } else {
      const competitions = await competitionService.getUpcomingCompetitions(
        session!.user.athleteProfileId!
      );
      return NextResponse.json(competitions);
    }
  } catch (err) {
    console.error("Error fetching competitions:", err);
    return NextResponse.json(
      { error: "Fehler beim Laden der Wettkämpfe" },
      { status: 500 }
    );
  }
}
