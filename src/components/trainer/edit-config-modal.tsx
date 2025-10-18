'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { X } from 'lucide-react';

interface EditConfigModalProps {
  athlete: {
    id: string;
    firstName: string;
    lastName: string;
    youthCategory: string;
    competitionParticipation: boolean;
    groupAssignments: Array<{
      id: string;
      groupNumber: number;
      trainingDay: string;
      hourNumber: number;
    }>;
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

export default function EditConfigModal({ athlete, onClose, onSuccess }: EditConfigModalProps) {
  const [config, setConfig] = useState<TrainingConfig>({
    youthCategory: athlete.youthCategory as 'F' | 'E' | 'D',
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
    competitionParticipation: athlete.competitionParticipation,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Pre-populate config from existing assignments
    const newConfig = { ...config };

    athlete.groupAssignments.forEach((assignment) => {
      const day = assignment.trainingDay as keyof typeof config.trainingDays;
      newConfig.trainingDays[day] = true;
      if (!newConfig.hours[day].includes(assignment.hourNumber)) {
        newConfig.hours[day].push(assignment.hourNumber);
      }
      newConfig.groupNumbers[day] = assignment.groupNumber;
    });

    // Sort hours
    (Object.keys(newConfig.hours) as Array<keyof typeof newConfig.hours>).forEach((day) => {
      newConfig.hours[day].sort();
    });

    setConfig(newConfig);
  }, [athlete]);

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

      const response = await fetch(`/api/trainer/athletes/${athlete.id}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update configuration');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Aktualisieren der Konfiguration');
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
            <h2 className="text-2xl font-bold text-gray-900">Konfiguration bearbeiten</h2>
            <p className="text-sm text-gray-600 mt-1">
              {athlete.firstName} {athlete.lastName}
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
                <label key={category} className="flex items-center gap-2 cursor-pointer">
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
          </div>

          {/* Training Days & Hours */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Trainingstage & Stunden</Label>
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
                              <label key={hour} className="flex items-center gap-2 cursor-pointer">
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
                              <label key={group} className="flex items-center gap-2 cursor-pointer">
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

          {/* Warning */}
          <Alert variant="warning">
            <strong>Hinweis:</strong> Änderungen wirken sich nur auf zukünftige Trainingseinheiten
            aus. Vergangene Einheiten bleiben unverändert.
          </Alert>

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
                'Änderungen speichern'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}