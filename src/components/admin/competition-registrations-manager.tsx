"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { YOUTH_CATEGORY_LABELS } from "@/lib/constants";
import { YouthCategory } from "@prisma/client";
import { Save } from "lucide-react";

interface Registration {
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
}

interface CompetitionRegistrationsManagerProps {
  competition: {
    id: string;
    name: string;
    date: string;
    registrations: Registration[];
  };
  onUpdate: () => void;
}

export function CompetitionRegistrationsManager({
  competition,
  onUpdate,
}: CompetitionRegistrationsManagerProps) {
  const isPast = new Date(competition.date) < new Date();
  const [registrations, setRegistrations] = useState<
    Record<
      string,
      { attended: boolean; placement: string; score: string }
    >
  >(
    Object.fromEntries(
      competition.registrations.map((r) => [
        r.athleteId,
        {
          attended: r.attended ?? false,
          placement: r.placement?.toString() ?? "",
          score: r.score ?? "",
        },
      ])
    )
  );
  const [saving, setSaving] = useState<string | null>(null);

  const handleSave = async (athleteId: string) => {
    setSaving(athleteId);
    try {
      const data = registrations[athleteId];
      const res = await fetch(
        `/api/admin/competitions/${competition.id}/registrations/${athleteId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attended: data.attended,
            placement: data.placement ? parseInt(data.placement) : null,
            score: data.score ? parseFloat(data.score) : null,
          }),
        }
      );
      if (res.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error saving registration:", error);
    } finally {
      setSaving(null);
    }
  };

  const handleRemove = async (athleteId: string) => {
    if (!confirm("Anmeldung wirklich löschen?")) return;

    try {
      const res = await fetch(
        `/api/admin/competitions/${competition.id}/registrations/${athleteId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error removing registration:", error);
    }
  };

  if (competition.registrations.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Keine Anmeldungen vorhanden
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left font-medium">Athlet</th>
              <th className="p-3 text-left font-medium">Altersklasse</th>
              {isPast && (
                <>
                  <th className="p-3 text-center font-medium">Teilgenommen</th>
                  <th className="p-3 text-center font-medium">Platzierung</th>
                  <th className="p-3 text-center font-medium">Punktzahl</th>
                  <th className="p-3 text-center font-medium">Aktionen</th>
                </>
              )}
              {!isPast && (
                <th className="p-3 text-center font-medium">Aktionen</th>
              )}
            </tr>
          </thead>
          <tbody>
            {competition.registrations.map((registration) => (
              <tr key={registration.id} className="border-b last:border-0">
                <td className="p-3">
                  {registration.athlete.user.firstName}{" "}
                  {registration.athlete.user.lastName}
                </td>
                <td className="p-3">
                  <Badge variant="outline">
                    {YOUTH_CATEGORY_LABELS[registration.athlete.youthCategory as keyof typeof YOUTH_CATEGORY_LABELS]}
                  </Badge>
                </td>
                {isPast && (
                  <>
                    <td className="p-3 text-center">
                      <Checkbox
                        checked={registrations[registration.athleteId]?.attended}
                        onCheckedChange={(checked) =>
                          setRegistrations({
                            ...registrations,
                            [registration.athleteId]: {
                              ...registrations[registration.athleteId],
                              attended: checked as boolean,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        min="1"
                        className="w-20 mx-auto"
                        placeholder="-"
                        value={registrations[registration.athleteId]?.placement}
                        onChange={(e) =>
                          setRegistrations({
                            ...registrations,
                            [registration.athleteId]: {
                              ...registrations[registration.athleteId],
                              placement: e.target.value,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        step="0.01"
                        className="w-24 mx-auto"
                        placeholder="-"
                        value={registrations[registration.athleteId]?.score}
                        onChange={(e) =>
                          setRegistrations({
                            ...registrations,
                            [registration.athleteId]: {
                              ...registrations[registration.athleteId],
                              score: e.target.value,
                            },
                          })
                        }
                      />
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={saving === registration.athleteId}
                        onClick={() => handleSave(registration.athleteId)}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </td>
                  </>
                )}
                {!isPast && (
                  <td className="p-3 text-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemove(registration.athleteId)}
                    >
                      Entfernen
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
