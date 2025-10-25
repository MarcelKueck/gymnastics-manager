'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { YouthCategory } from '@prisma/client';
import { YOUTH_CATEGORY_LABELS } from '@/lib/constants/statuses';

interface CompetitionFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function CompetitionForm({ initialData, onSubmit, onCancel }: CompetitionFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
    location: initialData?.location || '',
    description: initialData?.description || '',
    minYouthCategory: initialData?.minYouthCategory || '',
    maxYouthCategory: initialData?.maxYouthCategory || '',
    registrationDeadline: initialData?.registrationDeadline
      ? new Date(initialData.registrationDeadline).toISOString().split('T')[0]
      : '',
    maxParticipants: initialData?.maxParticipants || '',
    requiresDtbId: initialData?.requiresDtbId || false,
    entryFee: initialData?.entryFee ? Number(initialData.entryFee) : '',
    isPublished: initialData?.isPublished || false,
    isCancelled: initialData?.isCancelled || false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const submitData: any = {
        name: formData.name,
        date: formData.date,
        location: formData.location,
        description: formData.description || undefined,
        minYouthCategory: formData.minYouthCategory || null,
        maxYouthCategory: formData.maxYouthCategory || null,
        registrationDeadline: formData.registrationDeadline || null,
        maxParticipants: formData.maxParticipants ? Number(formData.maxParticipants) : null,
        requiresDtbId: formData.requiresDtbId,
        entryFee: formData.entryFee ? Number(formData.entryFee) : null,
        isPublished: formData.isPublished,
      };

      if (initialData) {
        submitData.isCancelled = formData.isCancelled;
      }

      await onSubmit(submitData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name des Wettkampfs *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="z.B. Bezirksmeisterschaft 2025"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Datum *</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="registrationDeadline">Anmeldeschluss</Label>
          <Input
            id="registrationDeadline"
            type="date"
            value={formData.registrationDeadline}
            onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Ort *</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          required
          placeholder="z.B. Turnhalle Musterstadt"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          placeholder="Weitere Informationen zum Wettkampf..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minYouthCategory">Mindest-Kategorie</Label>
          <select
            id="minYouthCategory"
            value={formData.minYouthCategory}
            onChange={(e) => setFormData({ ...formData, minYouthCategory: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Keine Einschränkung</option>
            {Object.values(YouthCategory).map((cat) => (
              <option key={cat} value={cat}>
                {YOUTH_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxYouthCategory">Maximal-Kategorie</Label>
          <select
            id="maxYouthCategory"
            value={formData.maxYouthCategory}
            onChange={(e) => setFormData({ ...formData, maxYouthCategory: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Keine Einschränkung</option>
            {Object.values(YouthCategory).map((cat) => (
              <option key={cat} value={cat}>
                {YOUTH_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="maxParticipants">Max. Teilnehmer</Label>
          <Input
            id="maxParticipants"
            type="number"
            min="1"
            value={formData.maxParticipants}
            onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
            placeholder="Unbegrenzt"
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
            onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="requiresDtbId"
            checked={formData.requiresDtbId}
            onChange={(e) => setFormData({ ...formData, requiresDtbId: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="requiresDtbId" className="cursor-pointer">
            DTB-ID erforderlich
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isPublished"
            checked={formData.isPublished}
            onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="isPublished" className="cursor-pointer">
            Veröffentlicht (für Athleten sichtbar)
          </Label>
        </div>

        {initialData && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isCancelled"
              checked={formData.isCancelled}
              onChange={(e) => setFormData({ ...formData, isCancelled: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isCancelled" className="cursor-pointer text-red-600">
              Wettkampf absagen
            </Label>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Wird gespeichert...' : initialData ? 'Aktualisieren' : 'Erstellen'}
        </Button>
      </div>
    </form>
  );
}
