'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface TrainingGroup {
  id: string;
  name: string;
  trainingId: string;
  recurringTraining: {
    name: string;
  };
}

interface TrainerGroupsEditorProps {
  trainerId: string;
  trainerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
}

export function TrainerGroupsEditor({
  trainerId,
  trainerName,
  open,
  onOpenChange,
  onSave,
}: TrainerGroupsEditorProps) {
  const [groups, setGroups] = useState<TrainingGroup[]>([]);
  const [trainerGroups, setTrainerGroups] = useState<Set<string>>(new Set());
  const [originalTrainerGroups, setOriginalTrainerGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, trainerId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all groups
      const groupsRes = await fetch('/api/admin/groups');
      if (!groupsRes.ok) throw new Error('Failed to fetch groups');
      const groupsData = await groupsRes.json();
      setGroups(groupsData.data || groupsData);

      // Fetch trainer's current groups
      const trainerRes = await fetch(`/api/admin/trainers/${trainerId}`);
      if (!trainerRes.ok) throw new Error('Failed to fetch trainer');
      const trainerData = await trainerRes.json();
      const trainer = trainerData.data || trainerData;
      
      // Extract group IDs from recurringTrainingAssignments
      const groupIds = trainer.recurringTrainingAssignments?.map((assignment: any) => assignment.trainingGroup.id) || [];
      const currentGroups = new Set<string>(groupIds);
      setTrainerGroups(currentGroups);
      setOriginalTrainerGroups(new Set(currentGroups));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    setTrainerGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Determine which groups to add and remove
      const groupsToAdd = Array.from(trainerGroups).filter(id => !originalTrainerGroups.has(id));
      const groupsToRemove = Array.from(originalTrainerGroups).filter(id => !trainerGroups.has(id));

      // Add trainer to new groups
      for (const groupId of groupsToAdd) {
        const response = await fetch(`/api/admin/groups/${groupId}/trainers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trainerIds: [trainerId] }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to add trainer to group');
        }
      }

      // Remove trainer from groups
      for (const groupId of groupsToRemove) {
        const response = await fetch(`/api/admin/groups/${groupId}/trainers`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trainerId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to remove trainer from group');
        }
      }

      toast.success('Gruppen erfolgreich aktualisiert');
      onSave?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving groups:', error);
      toast.error('Fehler beim Speichern der Gruppen');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gruppen für {trainerName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {groups.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Keine Gruppen verfügbar
                </p>
              ) : (
                groups.map((group) => (
                  <label
                    key={group.id}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={trainerGroups.has(group.id)}
                      onChange={() => toggleGroup(group.id)}
                      className="rounded"
                    />
                    <span className="text-sm">
                      {group.recurringTraining.name} - {group.name}
                    </span>
                  </label>
                ))
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  'Speichern'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
