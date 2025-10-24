'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { YouthCategory } from '@prisma/client';
import { YOUTH_CATEGORY_LABELS } from '@/lib/constants/statuses';

interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: Date;
  gender: string;
  phone: string;
  guardianName?: string;
  guardianEmail?: string;
  guardianPhone?: string;
}

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

interface AthleteApprovalModalProps {
  athlete: Athlete;
  availableGroups: TrainingGroup[];
  onApprove: (config: {
    youthCategory: YouthCategory;
    competitionParticipation: boolean;
    hasDtbId: boolean;
    trainingGroupIds: string[];
  }) => Promise<void>;
  onCancel: () => void;
}

export function AthleteApprovalModal({
  athlete,
  availableGroups,
  onApprove,
  onCancel,
}: AthleteApprovalModalProps) {
  const [youthCategory, setYouthCategory] = useState<YouthCategory>(YouthCategory.F);
  const [competitionParticipation, setCompetitionParticipation] = useState(false);
  const [hasDtbId, setHasDtbId] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedGroups.length === 0) {
      setError('Bitte mindestens eine Trainingsgruppe auswählen');
      return;
    }

    setIsLoading(true);
    try {
      await onApprove({
        youthCategory,
        competitionParticipation,
        hasDtbId,
        trainingGroupIds: selectedGroups,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Genehmigen');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Athlete Info */}
      <Card>
        <CardHeader>
          <CardTitle>Athleten-Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <strong>Name:</strong> {athlete.firstName} {athlete.lastName}
          </div>
          <div>
            <strong>Email:</strong> {athlete.email}
          </div>
          <div>
            <strong>Geburtsdatum:</strong>{' '}
            {new Date(athlete.birthDate).toLocaleDateString('de-DE')}
          </div>
          <div>
            <strong>Telefon:</strong> {athlete.phone}
          </div>
          {athlete.guardianName && (
            <div>
              <strong>Erziehungsberechtigter:</strong> {athlete.guardianName}
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Training Configuration */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="youthCategory">Jugendkategorie</Label>
          <select
            id="youthCategory"
            value={youthCategory}
            onChange={(e) => setYouthCategory(e.target.value as YouthCategory)}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
          >
            {Object.values(YouthCategory).map((cat) => (
              <option key={cat} value={cat}>
                {YOUTH_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="competition"
            checked={competitionParticipation}
            onChange={(e) => setCompetitionParticipation(e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="competition">Wettkampfteilnahme</Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="dtbId"
            checked={hasDtbId}
            onChange={(e) => setHasDtbId(e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="dtbId">DTB-ID vorhanden</Label>
        </div>
      </div>

      {/* Training Groups */}
      <div>
        <Label>Trainingsgruppen auswählen (mindestens eine)</Label>
        <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
          {availableGroups.map((group) => (
            <div key={group.id} className="flex items-start space-x-2">
              <input
                type="checkbox"
                id={`group-${group.id}`}
                checked={selectedGroups.includes(group.id)}
                onChange={() => toggleGroup(group.id)}
                className="mt-1 rounded border-gray-300"
              />
              <label htmlFor={`group-${group.id}`} className="flex-1 cursor-pointer">
                <div className="font-medium">{group.name}</div>
                <div className="text-sm text-muted-foreground">
                  {group.recurringTraining.name} - {group.recurringTraining.startTime} bis{' '}
                  {group.recurringTraining.endTime}
                </div>
              </label>
            </div>
          ))}
        </div>
        {selectedGroups.length === 0 && (
          <p className="text-sm text-muted-foreground mt-1">Keine Gruppen ausgewählt</p>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={isLoading || selectedGroups.length === 0}>
          {isLoading ? 'Wird genehmigt...' : 'Genehmigen'}
        </Button>
      </div>
    </form>
  );
}