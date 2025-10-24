'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, Users, AlertCircle } from 'lucide-react';

interface TrainingGroup {
  id: string;
  name: string;
  sortOrder: number;
  athleteCount: number;
  trainerCount: number;
  athletes?: any[];
}

interface GroupManagerProps {
  recurringTrainingId: string;
  recurringTrainingName: string;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
  groups: TrainingGroup[];
  onCreateGroup: (name: string) => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
  onReorder: (groupId: string, newSortOrder: number) => Promise<void>;
  onManageAthletes?: (group: TrainingGroup) => void;
  onManageTrainers?: (group: TrainingGroup) => void;
}

export function GroupManager({
  recurringTrainingId,
  recurringTrainingName,
  dayOfWeek,
  startTime,
  endTime,
  groups,
  onCreateGroup,
  onDeleteGroup,
  onReorder,
  onManageAthletes,
  onManageTrainers,
}: GroupManagerProps) {
  const [newGroupName, setNewGroupName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [deletingGroup, setDeletingGroup] = useState<string | null>(null);

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) {
      setError('Bitte gib einen Gruppennamen ein');
      return;
    }

    setError('');
    setIsAdding(true);
    try {
      await onCreateGroup(newGroupName);
      setNewGroupName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Möchtest du diese Gruppe wirklich löschen?')) {
      return;
    }

    setError('');
    setDeletingGroup(groupId);
    try {
      await onDeleteGroup(groupId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen');
    } finally {
      setDeletingGroup(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">{recurringTrainingName}</h3>
        {dayOfWeek && startTime && endTime && (
          <p className="text-sm text-muted-foreground mt-1">
            {dayOfWeek} • {startTime} - {endTime}
          </p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Add New Group */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Neue Gruppe hinzufügen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Gruppenname (z.B. Anfänger, Fortgeschrittene)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddGroup();
                  }
                }}
              />
            </div>
            <Button onClick={handleAddGroup} disabled={isAdding || !newGroupName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Hinzufügen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Groups */}
      <div className="space-y-3">
        {groups.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              Noch keine Gruppen vorhanden
            </CardContent>
          </Card>
        ) : (
          groups.map((group) => (
            <Card key={group.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{group.name}</span>
                  <div className="flex items-center space-x-3 text-sm font-normal text-muted-foreground">
                    <span className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {group.athleteCount} Athleten
                    </span>
                    <span>{group.trainerCount} Trainer</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-end space-x-2">
                  {onManageAthletes && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onManageAthletes(group)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Athleten
                    </Button>
                  )}
                  {onManageTrainers && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onManageTrainers(group)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Trainer
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteGroup(group.id)}
                    disabled={deletingGroup === group.id}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}