'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { X, Loader2 } from 'lucide-react';

interface EditConfigModalProps {
  athlete: {
    id: string;
    firstName: string;
    lastName: string;
    youthCategory: string;
    competitionParticipation: boolean;
    hasDtbId: boolean;
    groupAssignments: Array<{
      id: string;
      groupId: string;
      groupName: string;
      trainingId: string;
      trainingName: string;
    }>;
  };
  onClose: () => void;
  onSuccess: () => void;
}

interface RecurringTraining {
  id: string;
  name: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  groups: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
}

const dayTranslations: Record<string, string> = {
  MONDAY: 'Montag',
  THURSDAY: 'Donnerstag',
  FRIDAY: 'Freitag',
};

export default function EditConfigModal({ athlete, onClose, onSuccess }: EditConfigModalProps) {
  const [youthCategory, setYouthCategory] = useState(athlete.youthCategory as 'F' | 'E' | 'D');
  const [competitionParticipation, setCompetitionParticipation] = useState(
    athlete.competitionParticipation
  );
  const [hasDtbId, setHasDtbId] = useState(athlete.hasDtbId);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
    athlete.groupAssignments.map((a) => a.groupId)
  );

  const [availableTrainings, setAvailableTrainings] = useState<RecurringTraining[]>([]);
  const [loadingTrainings, setLoadingTrainings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableTrainings();
  }, []);

  const fetchAvailableTrainings = async () => {
    try {
      setLoadingTrainings(true);
      const response = await fetch('/api/admin/recurring-trainings?includeGroups=true');
      if (!response.ok) throw new Error('Failed to fetch trainings');
      const data = await response.json();
      setAvailableTrainings(data.trainings.filter((t: RecurringTraining & { isActive: boolean }) => t.isActive));
    } catch (err) {
      console.error('Error fetching trainings:', err);
      setError('Fehler beim Laden der verfügbaren Trainings');
    } finally {
      setLoadingTrainings(false);
    }
  };

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedGroupIds.length === 0) {
      setError('Bitte wählen Sie mindestens eine Trainingsgruppe aus');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/trainer/athletes/${athlete.id}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youthCategory,
          competitionParticipation,
          hasDtbId,
          groupIds: selectedGroupIds,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update configuration');
      }

      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Aktualisieren der Konfiguration';
      setError(errorMessage);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
                    checked={youthCategory === category}
                    onChange={(e) => setYouthCategory(e.target.value as 'F' | 'E' | 'D')}
                    className="w-4 h-4 text-teal-600"
                  />
                  <span className="font-medium">{category} Jugend</span>
                </label>
              ))}
            </div>
          </div>

          {/* Training Groups */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Trainingsgruppen auswählen
            </Label>

            {loadingTrainings ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                <span className="ml-3 text-gray-600">Lade Trainings...</span>
              </div>
            ) : availableTrainings.length === 0 ? (
              <Alert variant="warning">
                Keine aktiven Trainings gefunden. Bitte erstellen Sie zuerst Trainings und
                Gruppen.
              </Alert>
            ) : (
              <div className="space-y-4">
                {availableTrainings.map((training) => (
                  <div key={training.id} className="border rounded-lg p-4">
                    {/* Training Header */}
                    <div className="mb-3">
                      <h3 className="font-semibold text-gray-900">{training.name}</h3>
                      <p className="text-sm text-gray-600">
                        {dayTranslations[training.dayOfWeek]} •{' '}
                        {training.startTime.substring(0, 5)} - {training.endTime.substring(0, 5)}
                      </p>
                    </div>

                    {/* Groups */}
                    {training.groups.length > 0 ? (
                      <div className="space-y-2 ml-4">
                        {training.groups.map((group) => (
                          <label
                            key={group.id}
                            className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedGroupIds.includes(group.id)}
                              onChange={() => handleGroupToggle(group.id)}
                              className="w-5 h-5 text-teal-600 rounded mt-0.5"
                            />
                            <div className="flex-1">
                              <span className="font-medium text-gray-900">{group.name}</span>
                              {group.description && (
                                <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic ml-4">
                        Keine Gruppen in diesem Training
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Competition Participation */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Wettkampfteilnahme & DTB-ID
            </Label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={competitionParticipation}
                  onChange={(e) => setCompetitionParticipation(e.target.checked)}
                  className="w-5 h-5 text-teal-600 rounded"
                />
                <span>Athlet nimmt an Wettkämpfen teil</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDtbId}
                  onChange={(e) => setHasDtbId(e.target.checked)}
                  className="w-5 h-5 text-teal-600 rounded"
                />
                <span>DTB-ID ist vorhanden</span>
              </label>
            </div>
          </div>

          {/* Warning */}
          <Alert variant="warning">
            <strong>Hinweis:</strong> Änderungen an den Gruppenzuweisungen wirken sich auf alle
            zukünftigen Trainingseinheiten aus.
          </Alert>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={saving || loadingTrainings}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
