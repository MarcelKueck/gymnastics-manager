'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loading } from '@/components/ui/loading';
import { AlertCircle, UserPlus, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  youthCategory: string;
}

interface GroupAthletesManagerProps {
  groupId: string;
  groupName: string;
  currentAthletes: Athlete[];
  onUpdate: () => void;
  onCancel: () => void;
}

export function GroupAthletesManager({
  groupId,
  groupName,
  currentAthletes,
  onUpdate,
  onCancel,
}: GroupAthletesManagerProps) {
  const [allAthletes, setAllAthletes] = useState<Athlete[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAllAthletes();
  }, []);

  const fetchAllAthletes = async () => {
    try {
      const response = await fetch('/api/trainer/athletes?status=approved');
      if (!response.ok) throw new Error('Fehler beim Laden der Athleten');

      const data = await response.json();
      setAllAthletes(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAthlete = async (athleteId: string) => {
    setIsAdding(true);
    try {
      const response = await fetch(`/api/admin/groups/${groupId}/athletes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteIds: [athleteId] }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Hinzufügen');
      }

      toast.success('Athlet erfolgreich hinzugefügt');
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Hinzufügen');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveAthlete = async (athleteId: string) => {
    if (!confirm('Athlet aus dieser Gruppe entfernen?')) return;

    try {
      const response = await fetch(`/api/admin/groups/${groupId}/athletes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Entfernen');
      }

      toast.success('Athlet erfolgreich entfernt');
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Entfernen');
    }
  };

  const currentAthleteIds = currentAthletes.map((a) => a.id);
  const availableAthletes = allAthletes.filter(
    (athlete) =>
      !currentAthleteIds.includes(athlete.id) &&
      (searchQuery === '' ||
        athlete.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        athlete.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        athlete.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Athleten in "{groupName}"</h3>
        <p className="text-sm text-muted-foreground">
          Verwalte die Athleten, die dieser Trainingsgruppe zugeordnet sind
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Athletes */}
      <div>
        <h4 className="font-medium mb-3">
          Aktuelle Athleten ({currentAthletes.length})
        </h4>
        {currentAthletes.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Dieser Gruppe sind noch keine Athleten zugeordnet
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-3">
            {currentAthletes.map((athlete) => (
              <div
                key={athlete.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      {athlete.firstName} {athlete.lastName}
                    </span>
                    {athlete.youthCategory && (
                      <Badge variant="outline">{athlete.youthCategory}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{athlete.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAthlete(athlete.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Athletes */}
      <div>
        <h4 className="font-medium mb-3">Athleten hinzufügen</h4>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Athlet suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {availableAthletes.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {searchQuery
                  ? 'Keine Athleten gefunden'
                  : 'Alle Athleten sind bereits dieser Gruppe zugeordnet'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-3">
              {availableAthletes.map((athlete) => (
                <div
                  key={athlete.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {athlete.firstName} {athlete.lastName}
                      </span>
                      {athlete.youthCategory && (
                        <Badge variant="outline">{athlete.youthCategory}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{athlete.email}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddAthlete(athlete.id)}
                    disabled={isAdding}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Hinzufügen
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={onCancel}>
          Fertig
        </Button>
      </div>
    </div>
  );
}
