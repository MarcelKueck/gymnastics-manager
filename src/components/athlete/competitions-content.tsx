"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { YOUTH_CATEGORY_LABELS } from "@/lib/constants";
import { YouthCategory } from "@prisma/client";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Calendar, MapPin, Trophy, Users, Euro, Check, X } from "lucide-react";

interface Competition {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string | null;
  minYouthCategory: YouthCategory | null;
  maxYouthCategory: YouthCategory | null;
  registrationDeadline: string | null;
  maxParticipants: number | null;
  requiresDtbId: boolean;
  entryFee: string | null;
  isRegistered: boolean;
  registrationCount: number;
  registrations?: {
    attended: boolean | null;
    placement: number | null;
    score: string | null;
  }[];
}

export function CompetitionsContent() {
  const [upcomingCompetitions, setUpcomingCompetitions] = useState<Competition[]>([]);
  const [pastCompetitions, setPastCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      const [upcomingRes, pastRes] = await Promise.all([
        fetch("/api/athlete/competitions?type=upcoming"),
        fetch("/api/athlete/competitions?type=past"),
      ]);
      
      if (upcomingRes.ok) {
        setUpcomingCompetitions(await upcomingRes.json());
      }
      if (pastRes.ok) {
        setPastCompetitions(await pastRes.json());
      }
    } catch (error) {
      console.error("Error fetching competitions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (competitionId: string) => {
    setActionLoading(competitionId);
    try {
      const res = await fetch(`/api/athlete/competitions/${competitionId}/register`, {
        method: "POST",
      });
      if (res.ok) {
        fetchCompetitions();
      } else {
        const data = await res.json();
        alert(data.error || "Fehler bei der Anmeldung");
      }
    } catch (error) {
      console.error("Error registering:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnregister = async (competitionId: string) => {
    if (!confirm("Anmeldung wirklich zurückziehen?")) return;
    
    setActionLoading(competitionId);
    try {
      const res = await fetch(`/api/athlete/competitions/${competitionId}/register`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchCompetitions();
      } else {
        const data = await res.json();
        alert(data.error || "Fehler beim Abmelden");
      }
    } catch (error) {
      console.error("Error unregistering:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const getYouthCategoryRange = (competition: Competition) => {
    if (!competition.minYouthCategory && !competition.maxYouthCategory) {
      return null;
    }
    if (competition.minYouthCategory === competition.maxYouthCategory) {
      return YOUTH_CATEGORY_LABELS[competition.minYouthCategory as keyof typeof YOUTH_CATEGORY_LABELS];
    }
    const min = competition.minYouthCategory
      ? YOUTH_CATEGORY_LABELS[competition.minYouthCategory as keyof typeof YOUTH_CATEGORY_LABELS]
      : "Alle";
    const max = competition.maxYouthCategory
      ? YOUTH_CATEGORY_LABELS[competition.maxYouthCategory as keyof typeof YOUTH_CATEGORY_LABELS]
      : "Alle";
    return `${min} - ${max}`;
  };

  const isDeadlinePassed = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return <div className="p-8 text-center">Laden...</div>;
  }

  return (
    <div className="container py-8 space-y-8">
      <PageHeader
        title="Wettkämpfe"
        description="Verfügbare Wettkämpfe und deine Anmeldungen"
      />

      {/* Upcoming Competitions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          Anstehende Wettkämpfe ({upcomingCompetitions.length})
        </h2>
        {upcomingCompetitions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Keine anstehenden Wettkämpfe verfügbar
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingCompetitions.map((competition) => (
              <Card key={competition.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{competition.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(competition.date), "PPP", { locale: de })}
                      </CardDescription>
                    </div>
                    {competition.isRegistered && (
                      <Badge variant="default" className="bg-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Angemeldet
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {competition.location}
                  </div>
                  
                  {getYouthCategoryRange(competition) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Trophy className="h-4 w-4" />
                      {getYouthCategoryRange(competition)}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {competition.registrationCount}
                    {competition.maxParticipants
                      ? ` / ${competition.maxParticipants}`
                      : ""}{" "}
                    Anmeldungen
                  </div>

                  {competition.entryFee && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Euro className="h-4 w-4" />
                      {parseFloat(competition.entryFee).toFixed(2)} €
                    </div>
                  )}

                  {competition.registrationDeadline && (
                    <div className="text-xs text-muted-foreground">
                      Anmeldefrist:{" "}
                      {format(new Date(competition.registrationDeadline), "PPP", {
                        locale: de,
                      })}
                      {isDeadlinePassed(competition.registrationDeadline) && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Abgelaufen
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {competition.requiresDtbId && (
                      <Badge variant="outline" className="text-xs">
                        DTB-ID erforderlich
                      </Badge>
                    )}
                  </div>

                  {competition.description && (
                    <p className="text-sm text-muted-foreground pt-2">
                      {competition.description}
                    </p>
                  )}

                  <div className="pt-2">
                    {competition.isRegistered ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={
                          actionLoading === competition.id ||
                          isDeadlinePassed(competition.registrationDeadline)
                        }
                        onClick={() => handleUnregister(competition.id)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        {actionLoading === competition.id
                          ? "Wird abgemeldet..."
                          : "Abmelden"}
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        disabled={
                          actionLoading === competition.id ||
                          isDeadlinePassed(competition.registrationDeadline)
                        }
                        onClick={() => handleRegister(competition.id)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {actionLoading === competition.id
                          ? "Wird angemeldet..."
                          : "Anmelden"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Past Competitions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          Meine Ergebnisse ({pastCompetitions.filter(c => c.registrations && c.registrations.length > 0).length})
        </h2>
        {pastCompetitions.filter(c => c.registrations && c.registrations.length > 0).length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Keine vergangenen Wettkampfteilnahmen
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastCompetitions
              .filter((c) => c.registrations && c.registrations.length > 0)
              .map((competition) => {
                const registration = competition.registrations![0];
                return (
                  <Card key={competition.id} className="opacity-90">
                    <CardHeader>
                      <CardTitle className="text-lg">{competition.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(competition.date), "PPP", { locale: de })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {competition.location}
                      </div>

                      {registration.attended !== null && (
                        <div className="pt-2 space-y-2">
                          {registration.attended ? (
                            <>
                              <Badge variant="default" className="bg-green-600">
                                Teilgenommen
                              </Badge>
                              {registration.placement && (
                                <div className="flex items-center gap-2">
                                  <Trophy className="h-5 w-5 text-yellow-500" />
                                  <span className="font-semibold text-lg">
                                    Platz {registration.placement}
                                  </span>
                                </div>
                              )}
                              {registration.score && (
                                <div className="text-sm text-muted-foreground">
                                  Punktzahl: {registration.score}
                                </div>
                              )}
                            </>
                          ) : (
                            <Badge variant="secondary">Nicht teilgenommen</Badge>
                          )}
                        </div>
                      )}

                      {registration.attended === null && (
                        <Badge variant="outline">Ergebnis ausstehend</Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </section>
    </div>
  );
}
