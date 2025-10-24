'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { DayOfWeek, RecurrenceInterval } from '@prisma/client';
import { DAY_OF_WEEK_LABELS, RECURRENCE_INTERVAL_LABELS } from '@/lib/constants/statuses';

interface RecurringTrainingFormProps {
  initialData?: {
    id?: string;
    name: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    recurrence: RecurrenceInterval;
    isActive: boolean;
  };
  onSubmit: (data: {
    name: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    recurrence: RecurrenceInterval;
    isActive: boolean;
  }) => Promise<void>;
  onCancel: () => void;
}

export function RecurringTrainingForm({
  initialData,
  onSubmit,
  onCancel,
}: RecurringTrainingFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    dayOfWeek: initialData?.dayOfWeek || DayOfWeek.MONDAY,
    startTime: initialData?.startTime || '17:00',
    endTime: initialData?.endTime || '18:30',
    recurrence: initialData?.recurrence || RecurrenceInterval.WEEKLY,
    isActive: initialData?.isActive ?? true,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate times
    if (formData.startTime >= formData.endTime) {
      setError('Endzeit muss nach Startzeit liegen');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
      setIsLoading(false);
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

      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="z.B. Montag - Stunde 1"
          required
        />
      </div>

      <div>
        <Label htmlFor="dayOfWeek">Wochentag</Label>
        <select
          id="dayOfWeek"
          value={formData.dayOfWeek}
          onChange={(e) => handleChange('dayOfWeek', e.target.value)}
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
        >
          {Object.values(DayOfWeek).map((day) => (
            <option key={day} value={day}>
              {DAY_OF_WEEK_LABELS[day]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startTime">Startzeit</Label>
          <Input
            id="startTime"
            type="time"
            value={formData.startTime}
            onChange={(e) => handleChange('startTime', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="endTime">Endzeit</Label>
          <Input
            id="endTime"
            type="time"
            value={formData.endTime}
            onChange={(e) => handleChange('endTime', e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="recurrence">Wiederholung</Label>
        <select
          id="recurrence"
          value={formData.recurrence}
          onChange={(e) => handleChange('recurrence', e.target.value)}
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
        >
          {Object.values(RecurrenceInterval).map((interval) => (
            <option key={interval} value={interval}>
              {RECURRENCE_INTERVAL_LABELS[interval]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => handleChange('isActive', e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="isActive">Aktiv</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Speichere...' : initialData?.id ? 'Aktualisieren' : 'Erstellen'}
        </Button>
      </div>
    </form>
  );
}