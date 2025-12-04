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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { CompetitionForm } from "./competition-form";
import { CompetitionRegistrationsManager } from "./competition-registrations-manager";
import { YOUTH_CATEGORY_LABELS } from "@/lib/constants";
import { YouthCategory } from "@prisma/client";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  Trophy,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";

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
  isPublished: boolean;
  isCancelled: boolean;
  registrations: {
    id: string;
    athleteId: string;
    attended: boolean | null;
    placement: number | null;
    score: string | null;
    athlete: {
      id: string;
      youthCategory: YouthCategory;
      user: {
        firstName: string;
        lastName: string;
      };
    };
  }[];
  createdByTrainer: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export function CompetitionsContent() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const [managingRegistrations, setManagingRegistrations] = useState<Competition | null>(null);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      const res = await fetch("/api/admin/competitions");
      if (res.ok) {
        const data = await res.json();
        setCompetitions(data);
      }
    } catch (error) {
      console.error("Error fetching competitions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Wettkampf wirklich löschen?")) return;

    try {
      const res = await fetch(`/api/admin/competitions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchCompetitions();
      }
    } catch (error) {
      console.error("Error deleting competition:", error);
    }
  };

  const handleTogglePublish = async (competition: Competition) => {
    try {
      const res = await fetch(`/api/admin/competitions/${competition.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !competition.isPublished }),
      });
      if (res.ok) {
        fetchCompetitions();
      }
    } catch (error) {
      console.error("Error toggling publish:", error);
    }
  };

  const getYouthCategoryRange = (competition: Competition) => {
    if (!competition.minYouthCategory && !competition.maxYouthCategory) {
      return "Alle Altersklassen";
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

  const upcomingCompetitions = competitions.filter(
    (c) => new Date(c.date) >= new Date() && !c.isCancelled
  );
  const pastCompetitions = competitions.filter(
    (c) => new Date(c.date) < new Date() || c.isCancelled
  );

  if (loading) {
    return <div className="p-8 text-center">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wettkämpfe"
        description="Wettkämpfe verwalten und Ergebnisse eintragen"
        actions={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="h-10">
                <Plus className="h-4 w-4 mr-2" />
                Neuer Wettkampf
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Neuer Wettkampf</DialogTitle>
                <DialogDescription>
                  Erstellen Sie einen neuen Wettkampf
                </DialogDescription>
              </DialogHeader>
              <CompetitionForm
                onSuccess={() => {
                  setIsCreateOpen(false);
                  fetchCompetitions();
                }}
                onCancel={() => setIsCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {/* Upcoming Competitions */}
      <section>
        <h2 className="text-lg font-semibold mb-4 sm:text-xl">
          Anstehende Wettkämpfe ({upcomingCompetitions.length})
        </h2>
        {upcomingCompetitions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Keine anstehenden Wettkämpfe
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
                    <div className="flex gap-1">
                      {competition.isPublished ? (
                        <Badge variant="default">Veröffentlicht</Badge>
                      ) : (
                        <Badge variant="secondary">Entwurf</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {competition.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    {getYouthCategoryRange(competition)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {competition.registrations.length}
                    {competition.maxParticipants
                      ? ` / ${competition.maxParticipants}`
                      : ""}{" "}
                    Anmeldungen
                  </div>
                  {competition.requiresDtbId && (
                    <Badge variant="outline" className="text-xs">
                      DTB-ID erforderlich
                    </Badge>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setManagingRegistrations(competition)}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Teilnehmer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCompetition(competition)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTogglePublish(competition)}
                    >
                      {competition.isPublished ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(competition.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Past Competitions */}
      <section>
        <h2 className="text-lg font-semibold mb-4 sm:text-xl">
          Vergangene Wettkämpfe ({pastCompetitions.length})
        </h2>
        {pastCompetitions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Keine vergangenen Wettkämpfe
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastCompetitions.map((competition) => (
              <Card key={competition.id} className="opacity-75">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{competition.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(competition.date), "PPP", { locale: de })}
                      </CardDescription>
                    </div>
                    {competition.isCancelled && (
                      <Badge variant="destructive">Abgesagt</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {competition.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {competition.registrations.length} Teilnehmer
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setManagingRegistrations(competition)}
                    >
                      <Trophy className="h-4 w-4 mr-1" />
                      Ergebnisse
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Edit Competition Dialog */}
      <Dialog
        open={!!editingCompetition}
        onOpenChange={(open) => !open && setEditingCompetition(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Wettkampf bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Wettkampfdaten
            </DialogDescription>
          </DialogHeader>
          {editingCompetition && (
            <CompetitionForm
              competition={editingCompetition}
              onSuccess={() => {
                setEditingCompetition(null);
                fetchCompetitions();
              }}
              onCancel={() => setEditingCompetition(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Registrations Dialog */}
      <Dialog
        open={!!managingRegistrations}
        onOpenChange={(open) => !open && setManagingRegistrations(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Teilnehmer: {managingRegistrations?.name}
            </DialogTitle>
            <DialogDescription>
              Teilnehmer verwalten und Ergebnisse eintragen
            </DialogDescription>
          </DialogHeader>
          {managingRegistrations && (
            <CompetitionRegistrationsManager
              competition={managingRegistrations}
              onUpdate={fetchCompetitions}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
