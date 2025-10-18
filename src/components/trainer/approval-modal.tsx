'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ApprovalModalProps {
  athlete: {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

interface TrainingConfig {
  youthCategory: 'F' | 'E' | 'D';
  trainingDays: {
    MONDAY: boolean;
    THURSDAY: boolean;
    FRIDAY: boolean;
  };
  hours: {
    MONDAY: number[];
    THURSDAY: number[];
    FRIDAY: number[];
  };
  groupNumbers: {
    MONDAY: number;
    THURSDAY: number;
    FRIDAY: number;
  };
  competitionParticipation: boolean;
}

const dayNames = {
  MONDAY: 'Montag',
  THURSDAY: 'Donnerstag',
  FRIDAY: 'Freitag',
};

export default function ApprovalModal({ athlete, onClose, onSuccess }: ApprovalModalProps) {
  const [config, setConfig] = useState<TrainingConfig>({
    youthCategory: 'F',
    trainingDays: {
      MONDAY: false,
      THURSDAY: false,
      FRIDAY: false,
    },
    hours: {
      MONDAY: [],
      THURSDAY: [],
      FRIDAY: [],
    },
    groupNumbers: {
      MONDAY: 1,
      THURSDAY: 1,
      FRIDAY: 1,
    },
    competitionParticipation: false,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    // Auto-calculate youth category from birth date
    const birthYear = new Date(athlete.birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;

    let category: 'F' | 'E' | 'D' = 'F';
    if (age >= 7 && age <= 9) category = 'F';
    else if (age >= 10 && age <= 12) category = 'E';
    else if (age >= 13 && age <= 15) category = 'D';

    setConfig((prev) => ({ ...prev, youthCategory: category }));
  }, [athlete.birthDate]);

  useEffect(() => {
    // Calculate number of sessions that will be generated
    let count = 0;
    Object.entries(config.trainingDays).forEach(([day, enabled]) => {
      if (enabled) {
        const dayKey = day as keyof typeof config.hours;
        count += config.hours[dayKey].length;
      }
    });
    // Approximately 52 weeks per year, looking ahead 12 weeks
    setSessionCount(count * 12);
  }, [config]);

  const handleDayToggle = (day: keyof typeof config.trainingDays) => {
    setConfig((prev) => ({
      ...prev,
      trainingDays: {
        ...prev.trainingDays,
        [day]: !prev.trainingDays[day],
      },
    }));
  };

  const handleHourToggle = (day: keyof typeof config.hours, hour: number) => {
    setConfig((prev) => {
      const currentHours = prev.hours[day];
      const newHours = currentHours.includes(hour)
        ? currentHours.filter((h) => h !== hour)
        : [...currentHours, hour].sort();

      return {
        ...prev,
        hours: {
          ...prev.hours,
          [day]: newHours,
        },
      };
    });
  };

  const handleGroupChange = (day: keyof typeof config.groupNumbers, group: number) => {
    setConfig((prev) => ({
      ...prev,
      groupNumbers: {
        ...prev.groupNumbers,
        [day]: group,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const selectedDays = Object.values(config.trainingDays).filter(Boolean).length;
    if (selectedDays === 0) {
      setError('Bitte wählen Sie mindestens einen Trainingstag aus');
      return;
    }

    // Check that each selected day has at least one hour
    for (const [day, enabled] of Object.entries(config.trainingDays)) {
      if (enabled) {
        const dayKey = day as keyof typeof config.hours;
        if (config.hours[dayKey].length === 0) {
          setError(`Bitte wählen Sie mindestens eine Stunde für ${dayNames[dayKey]} aus`);
          return;
        }
      }
    }

    try {
      setSaving(true);

      const response = await fetch('/api/trainer/athletes/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athleteId: athlete.id,
          config,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve athlete');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Genehmigen des Athleten');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Athlet genehmigen & konfigurieren
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {athlete.firstName} {athlete.lastName} •{' '}
              {format(new Date(athlete.birthDate), 'dd.MM.yyyy', { locale: de })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && <Alert variant="error">{error}</Alert>}

          {/* Youth Category */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Jugendkategorie</Label>
            <div className="flex gap-4">
              {(['F', 'E', 'D'] as const).map((category) => (
                <label
                  key={category}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="youthCategory"
                    value={category}
                    checked={config.youthCategory === category}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        youthCategory: e.target.value as 'F' | 'E' | 'D',
                      }))
                    }
                    className="w-4 h-4 text-orange-600"
                  />
                  <span className="font-medium">{category} Jugend</span>
                </label>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Automatisch berechnet basierend auf dem Geburtsdatum, kann überschrieben werden
            </p>
          </div>

          {/* Training Days & Hours */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Trainingstage & Stunden
            </Label>
            <div className="space-y-4">
              {(Object.keys(config.trainingDays) as Array<keyof typeof config.trainingDays>).map(
                (day) => (
                  <div key={day} className="border rounded-lg p-4">
                    {/* Day Checkbox */}
                    <label className="flex items-center gap-3 mb-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.trainingDays[day]}
                        onChange={() => handleDayToggle(day)}
                        className="w-5 h-5 text-orange-600 rounded"
                      />
                      <span className="font-semibold text-gray-900">{dayNames[day]}</span>
                    </label>

                    {/* Hours & Group (only if day is selected) */}
                    {config.trainingDays[day] && (
                      <div className="ml-8 space-y-3">
                        {/* Hour Selection */}
                        <div>
                          <Label className="text-sm mb-2 block">Stunden</Label>
                          <div className="flex gap-3">
                            {[1, 2].map((hour) => (
                              <label
                                key={hour}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={config.hours[day].includes(hour)}
                                  onChange={() => handleHourToggle(day, hour)}
                                  className="w-4 h-4 text-orange-600 rounded"
                                />
                                <span>{hour}. Stunde</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Group Selection */}
                        <div>
                          <Label className="text-sm mb-2 block">Gruppe</Label>
                          <div className="flex gap-3">
                            {[1, 2, 3].map((group) => (
                              <label
                                key={group}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name={`group-${day}`}
                                  value={group}
                                  checked={config.groupNumbers[day] === group}
                                  onChange={() => handleGroupChange(day, group)}
                                  className="w-4 h-4 text-orange-600"
                                />
                                <span>Gruppe {group}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Competition Participation */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Wettkampfteilnahme</Label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.competitionParticipation}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    competitionParticipation: e.target.checked,
                  }))
                }
                className="w-5 h-5 text-orange-600 rounded"
              />
              <span>Athletin nimmt an Wettkämpfen teil</span>
            </label>
          </div>

          {/* Preview */}
          {sessionCount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Vorschau:</strong> Es werden ca. {sessionCount} Trainingseinheiten für die
                nächsten 12 Wochen generiert.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Wird gespeichert...
                </>
              ) : (
                'Speichern & Genehmigen'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}