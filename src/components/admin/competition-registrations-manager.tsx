'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Check, X, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { YOUTH_CATEGORY_LABELS } from '@/lib/constants/statuses';

interface CompetitionRegistrationsManagerProps {
  competition: any;
  onUpdate: () => void;
  onClose: () => void;
}

export function CompetitionRegistrationsManager({
  competition,
  onUpdate,
  onClose,
}: CompetitionRegistrationsManagerProps) {
  const [editingRegistration, setEditingRegistration] = useState<string | null>(null);
  const [registrationData, setRegistrationData] = useState<{
    [key: string]: {
      attended: boolean | null;
      placement: string;
      score: string;
    };
  }>({});

  const handleUpdateRegistration = async (registrationId: string) => {
    try {
      const data = registrationData[registrationId];
      const response = await fetch(
        `/api/admin/competitions/${competition.id}/registrations/${registrationId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attended: data.attended,
            placement: data.placement ? Number(data.placement) : null,
            score: data.score ? Number(data.score) : null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Aktualisieren');
      }

      toast.success('Erfolgreich aktualisiert');
      setEditingRegistration(null);
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Aktualisieren');
    }
  };

  const startEditing = (registration: any) => {
    setEditingRegistration(registration.id);
    setRegistrationData({
      ...registrationData,
      [registration.id]: {
        attended: registration.attended ?? null,
        placement: registration.placement?.toString() || '',
        score: registration.score?.toString() || '',
      },
    });
  };

  const isPast = new Date(competition.date) < new Date();

  return (
    <div className="space-y-6">
      {/* Competition Info */}
      <Card>
        <CardHeader>
          <CardTitle>Wettkampf-Informationen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <strong>Name:</strong> {competition.name}
          </div>
          <div>
            <strong>Datum:</strong> {formatDate(competition.date)}
          </div>
          <div>
            <strong>Ort:</strong> {competition.location}
          </div>
          <div>
            <strong>Anmeldungen:</strong> {competition.registrations.length}
            {competition.maxParticipants && ` / ${competition.maxParticipants} max`}
          </div>
        </CardContent>
      </Card>

      {/* Registrations List */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          Angemeldete Athleten ({competition.registrations.length})
        </h3>

        {competition.registrations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              Noch keine Anmeldungen
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {competition.registrations.map((registration: any) => (
              <Card key={registration.id}>
                <CardContent className="pt-6">
                  {editingRegistration === registration.id ? (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {registration.athlete.user.firstName} {registration.athlete.user.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {YOUTH_CATEGORY_LABELS[registration.athlete.youthCategory as keyof typeof YOUTH_CATEGORY_LABELS]}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Teilnahme</Label>
                          <select
                            value={
                              registrationData[registration.id]?.attended === true
                                ? 'true'
                                : registrationData[registration.id]?.attended === false
                                ? 'false'
                                : ''
                            }
                            onChange={(e) =>
                              setRegistrationData({
                                ...registrationData,
                                [registration.id]: {
                                  ...registrationData[registration.id],
                                  attended:
                                    e.target.value === 'true'
                                      ? true
                                      : e.target.value === 'false'
                                      ? false
                                      : null,
                                },
                              })
                            }
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Nicht erfasst</option>
                            <option value="true">Anwesend</option>
                            <option value="false">Abwesend</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label>Platzierung</Label>
                          <Input
                            type="number"
                            min="1"
                            placeholder="z.B. 1"
                            value={registrationData[registration.id]?.placement || ''}
                            onChange={(e) =>
                              setRegistrationData({
                                ...registrationData,
                                [registration.id]: {
                                  ...registrationData[registration.id],
                                  placement: e.target.value,
                                },
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Punktzahl</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="z.B. 45.5"
                            value={registrationData[registration.id]?.score || ''}
                            onChange={(e) =>
                              setRegistrationData({
                                ...registrationData,
                                [registration.id]: {
                                  ...registrationData[registration.id],
                                  score: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingRegistration(null)}
                        >
                          Abbrechen
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateRegistration(registration.id)}
                        >
                          Speichern
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <p className="font-medium">
                            {registration.athlete.user.firstName} {registration.athlete.user.lastName}
                          </p>
                          <Badge variant="outline">
                            {YOUTH_CATEGORY_LABELS[registration.athlete.youthCategory as keyof typeof YOUTH_CATEGORY_LABELS]}
                          </Badge>
                          {registration.attended === true && (
                            <Badge variant="default">
                              <Check className="h-3 w-3 mr-1" />
                              Teilgenommen
                            </Badge>
                          )}
                          {registration.attended === false && (
                            <Badge variant="destructive">
                              <X className="h-3 w-3 mr-1" />
                              Nicht erschienen
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          <span>Angemeldet: {formatDate(registration.registeredAt)}</span>
                          {registration.placement && (
                            <span className="flex items-center">
                              <Trophy className="h-3 w-3 mr-1" />
                              Platz {registration.placement}
                            </span>
                          )}
                          {registration.score && <span>Punkte: {Number(registration.score).toFixed(2)}</span>}
                        </div>
                        {registration.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Notiz: {registration.notes}
                          </p>
                        )}
                      </div>
                      {isPast && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(registration)}
                        >
                          Bearbeiten
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={onClose}>Schließen</Button>
      </div>
    </div>
  );
}
