"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { YOUTH_CATEGORY_LABELS } from "@/lib/constants";
import { YouthCategory } from "@prisma/client";
import { format } from "date-fns";

interface CompetitionFormProps {
  competition?: {
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
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function CompetitionForm({
  competition,
  onSuccess,
  onCancel,
}: CompetitionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: competition?.name || "",
    date: competition?.date
      ? format(new Date(competition.date), "yyyy-MM-dd")
      : "",
    location: competition?.location || "",
    description: competition?.description || "",
    minYouthCategory: competition?.minYouthCategory || "",
    maxYouthCategory: competition?.maxYouthCategory || "",
    registrationDeadline: competition?.registrationDeadline
      ? format(new Date(competition.registrationDeadline), "yyyy-MM-dd")
      : "",
    maxParticipants: competition?.maxParticipants?.toString() || "",
    requiresDtbId: competition?.requiresDtbId || false,
    entryFee: competition?.entryFee || "",
    isPublished: competition?.isPublished || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        date: new Date(formData.date).toISOString(),
        location: formData.location,
        description: formData.description || null,
        minYouthCategory: formData.minYouthCategory || null,
        maxYouthCategory: formData.maxYouthCategory || null,
        registrationDeadline: formData.registrationDeadline
          ? new Date(formData.registrationDeadline).toISOString()
          : null,
        maxParticipants: formData.maxParticipants
          ? parseInt(formData.maxParticipants)
          : null,
        requiresDtbId: formData.requiresDtbId,
        entryFee: formData.entryFee ? parseFloat(formData.entryFee) : null,
        isPublished: formData.isPublished,
      };

      const url = competition
        ? `/api/admin/competitions/${competition.id}`
        : "/api/admin/competitions";
      const method = competition ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Speichern");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Datum *</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) =>
              setFormData({ ...formData, date: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="location">Ort *</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Beschreibung</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="minYouthCategory">Mindestaltersklasse</Label>
          <Select
            value={formData.minYouthCategory}
            onValueChange={(value) =>
              setFormData({ ...formData, minYouthCategory: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Keine Einschränkung" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Keine Einschränkung</SelectItem>
              {Object.entries(YOUTH_CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxYouthCategory">Maximale Altersklasse</Label>
          <Select
            value={formData.maxYouthCategory}
            onValueChange={(value) =>
              setFormData({ ...formData, maxYouthCategory: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Keine Einschränkung" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Keine Einschränkung</SelectItem>
              {Object.entries(YOUTH_CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="registrationDeadline">Anmeldefrist</Label>
          <Input
            id="registrationDeadline"
            type="date"
            value={formData.registrationDeadline}
            onChange={(e) =>
              setFormData({ ...formData, registrationDeadline: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxParticipants">Max. Teilnehmer</Label>
          <Input
            id="maxParticipants"
            type="number"
            min="1"
            value={formData.maxParticipants}
            onChange={(e) =>
              setFormData({ ...formData, maxParticipants: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="entryFee">Startgebühr (€)</Label>
          <Input
            id="entryFee"
            type="number"
            step="0.01"
            min="0"
            value={formData.entryFee}
            onChange={(e) =>
              setFormData({ ...formData, entryFee: e.target.value })
            }
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pt-2">
        <div className="flex items-center space-x-2 min-h-[44px]">
          <Checkbox
            id="requiresDtbId"
            checked={formData.requiresDtbId}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, requiresDtbId: checked as boolean })
            }
          />
          <Label htmlFor="requiresDtbId" className="text-sm font-normal cursor-pointer">
            DTB-ID erforderlich
          </Label>
        </div>

        <div className="flex items-center space-x-2 min-h-[44px]">
          <Checkbox
            id="isPublished"
            checked={formData.isPublished}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isPublished: checked as boolean })
            }
          />
          <Label htmlFor="isPublished" className="text-sm font-normal cursor-pointer">
            Sofort veröffentlichen
          </Label>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          Abbrechen
        </Button>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Speichern..." : competition ? "Aktualisieren" : "Erstellen"}
        </Button>
      </div>
    </form>
  );
}
