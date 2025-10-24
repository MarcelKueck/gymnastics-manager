'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Copy, Save } from 'lucide-react';

interface SessionGroup {
  id: string;
  trainingGroup: {
    name: string;
  };
  exercises?: string;
  notes?: string;
}

interface SessionEditorProps {
  sessionId: string;
  sessionGroups: SessionGroup[];
  onSave: (updates: { sessionGroupId: string; exercises: string; notes: string }[]) => Promise<void>;
  onCopyFromPrevious?: (sessionGroupId: string) => Promise<string>;
}

export function SessionEditor({
  sessionId,
  sessionGroups,
  onSave,
  onCopyFromPrevious,
}: SessionEditorProps) {
  const [groupData, setGroupData] = useState<
    Record<string, { exercises: string; notes: string }>
  >(
    sessionGroups.reduce((acc, group) => {
      acc[group.id] = {
        exercises: group.exercises || '',
        notes: group.notes || '',
      };
      return acc;
    }, {} as Record<string, { exercises: string; notes: string }>)
  );
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copyingGroup, setCopyingGroup] = useState<string | null>(null);

  const handleChange = (groupId: string, field: 'exercises' | 'notes', value: string) => {
    setGroupData((prev) => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        [field]: value,
      },
    }));
  };

  const handleCopyFromPrevious = async (groupId: string) => {
    if (!onCopyFromPrevious) return;

    setCopyingGroup(groupId);
    try {
      const previousExercises = await onCopyFromPrevious(groupId);
      handleChange(groupId, 'exercises', previousExercises);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Kopieren');
    } finally {
      setCopyingGroup(null);
    }
  };

  const handleSave = async () => {
    setError('');
    setIsLoading(true);

    try {
      const updates = sessionGroups.map((group) => ({
        sessionGroupId: group.id,
        exercises: groupData[group.id]?.exercises || '',
        notes: groupData[group.id]?.notes || '',
      }));

      await onSave(updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {sessionGroups.map((group) => (
        <Card key={group.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{group.trainingGroup.name}</CardTitle>
              {onCopyFromPrevious && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyFromPrevious(group.id)}
                  disabled={copyingGroup === group.id}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copyingGroup === group.id ? 'Kopiere...' : 'Von letzter Woche'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor={`exercises-${group.id}`}>Übungen</Label>
              <Textarea
                id={`exercises-${group.id}`}
                value={groupData[group.id]?.exercises || ''}
                onChange={(e) => handleChange(group.id, 'exercises', e.target.value)}
                placeholder="Übungen für diese Gruppe eingeben..."
                rows={6}
              />
            </div>
            <div>
              <Label htmlFor={`notes-${group.id}`}>Notizen</Label>
              <Textarea
                id={`notes-${group.id}`}
                value={groupData[group.id]?.notes || ''}
                onChange={(e) => handleChange(group.id, 'notes', e.target.value)}
                placeholder="Zusätzliche Notizen..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Speichere...' : 'Speichern'}
        </Button>
      </div>
    </div>
  );
}