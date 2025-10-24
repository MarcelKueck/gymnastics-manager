'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loading } from '@/components/ui/loading';
import { AlertCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

interface TrainingGroup {
  id: string;
  name: string;
  recurringTraining: {
    name: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  };
}

interface AthleteGroupsEditorProps {
  athleteId: string;
  athleteName: string;
  currentGroupIds: string[];
  onUpdate: () => void;
  onCancel: () => void;
}

export function AthleteGroupsEditor({
  athleteId,
  athleteName,
  currentGroupIds,
  onUpdate,
  onCancel,
}: AthleteGroupsEditorProps) {
  const [availableGroups, setAvailableGroups] = useState<TrainingGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(currentGroupIds);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAvailableGroups();
  }, []);

  const fetchAvailableGroups = async () => {
    try {
      const response = await fetch('/api/admin/trainings');
      if (!response.ok) throw new Error('Fehler beim Laden der Gruppen');

      const data = await response.json();
      
      // Flatten all groups from all trainings
      const allGroups = data.data.flatMap((training: any) =>
        training.groups.map((group: any) => ({
          id: group.id,
          name: group.name,
          recurringTraining: {
            name: training.name,
            dayOfWeek: training.dayOfWeek,
            startTime: training.startTime,
            endTime: training.endTime,
          },
        }))
      );
      
      setAvailableGroups(allGroups);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      // Determine groups to add and remove
      const groupsToAdd = selectedGroupIds.filter((id) => !currentGroupIds.includes(id));
      const groupsToRemove = currentGroupIds.filter((id) => !selectedGroupIds.includes(id));

      // Add new groups
      for (const groupId of groupsToAdd) {
        const response = await fetch(`/api/admin/groups/${groupId}/athletes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ athleteIds: [athleteId] }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Fehler beim Hinzufügen');
        }
      }

      // Remove groups
      for (const groupId of groupsToRemove) {
        const response = await fetch(`/api/admin/groups/${groupId}/athletes`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ athleteId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Fehler beim Entfernen');
        }
      }

      toast.success('Gruppenauswahl erfolgreich aktualisiert');
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Trainingsgruppen für {athleteName}</h3>
        <p className="text-sm text-muted-foreground">
          Wähle die Gruppen aus, denen der Athlet zugeordnet werden soll
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {availableGroups.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Keine Trainingsgruppen vorhanden. Bitte erstelle zuerst Trainings und Gruppen.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto border rounded-md p-3">
          {availableGroups.map((group) => (
            <div key={group.id} className="flex items-start space-x-2">
              <input
                type="checkbox"
                id={`group-${group.id}`}
                checked={selectedGroupIds.includes(group.id)}
                onChange={() => toggleGroup(group.id)}
                disabled={isSaving}
                className="mt-1 rounded border-gray-300"
              />
              <label htmlFor={`group-${group.id}`} className="flex-1 cursor-pointer">
                <div className="font-medium">{group.name}</div>
                <div className="text-sm text-muted-foreground">
                  {group.recurringTraining.name} - {group.recurringTraining.dayOfWeek},{' '}
                  {group.recurringTraining.startTime} bis {group.recurringTraining.endTime}
                </div>
              </label>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center pt-4">
        <p className="text-sm text-muted-foreground">
          {selectedGroupIds.length} {selectedGroupIds.length === 1 ? 'Gruppe' : 'Gruppen'}{' '}
          ausgewählt
        </p>
        <div className="flex space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || availableGroups.length === 0}
          >
            {isSaving ? 'Wird gespeichert...' : 'Speichern'}
          </Button>
        </div>
      </div>
    </div>
  );
}
