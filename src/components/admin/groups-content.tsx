'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Users } from 'lucide-react';
import { GroupManager } from './group-manager';
import { GroupAthletesManager } from './group-athletes-manager';
import { GroupTrainersManager } from './group-trainers-manager';

export function AdminGroupsContent() {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [showAthletesManager, setShowAthletesManager] = useState(false);
  const [showTrainersManager, setShowTrainersManager] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<string>('');

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      const response = await fetch('/api/admin/trainings?activeOnly=false');
      if (!response.ok) throw new Error('Fehler beim Laden der Trainings');

      const data = await response.json();
      setTrainings(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async (trainingId: string, name: string) => {
    const response = await fetch(`/api/admin/trainings/${trainingId}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Fehler beim Erstellen');
    }

    await fetchTrainings();
  };

  const handleDeleteGroup = async (groupId: string) => {
    const response = await fetch(`/api/admin/groups/${groupId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Fehler beim Löschen');
    }

    await fetchTrainings();
  };

  const handleReorder = async (groupId: string, newSortOrder: number) => {
    const response = await fetch(`/api/admin/groups/${groupId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sortOrder: newSortOrder }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Fehler beim Sortieren');
    }

    await fetchTrainings();
  };

  if (isLoading) return <Loading />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gruppen verwalten</h1>
        <p className="text-muted-foreground">
          Verwalte Trainingsgruppen für jedes wiederkehrende Training
        </p>
      </div>

      {trainings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            Keine Trainings gefunden. Bitte erstelle zuerst ein wiederkehrendes Training.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {trainings.map((training) => (
            <Card key={training.id}>
              <CardContent className="pt-6">
                <GroupManager
                  recurringTrainingId={training.id}
                  recurringTrainingName={`${training.name} - ${training.dayOfWeek}, ${training.startTime}-${training.endTime}`}
                  groups={training.groups.map((group: any) => ({
                    id: group.id,
                    name: group.name,
                    sortOrder: group.sortOrder,
                    athleteCount: group.athleteAssignments?.length || 0,
                    trainerCount: group.trainerAssignments?.length || 0,
                    athletes: group.athleteAssignments?.map((a: any) => a.athlete) || [],
                  }))}
                  onCreateGroup={(name) => handleCreateGroup(training.id, name)}
                  onDeleteGroup={handleDeleteGroup}
                  onReorder={handleReorder}
                  onManageAthletes={(group: any) => {
                    setSelectedGroup(group);
                    setSelectedTraining(training.name);
                    setShowAthletesManager(true);
                  }}
                  onManageTrainers={(group: any) => {
                    setSelectedGroup(group);
                    setSelectedTraining(training.name);
                    setShowTrainersManager(true);
                  }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Athletes Manager Modal */}
      <Dialog open={showAthletesManager} onOpenChange={setShowAthletesManager}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Athleten verwalten</DialogTitle>
          </DialogHeader>
          {selectedGroup && (
            <GroupAthletesManager
              groupId={selectedGroup.id}
              groupName={selectedGroup.name}
              currentAthletes={selectedGroup.athletes || []}
              onUpdate={() => {
                fetchTrainings();
              }}
              onCancel={() => {
                setShowAthletesManager(false);
                setSelectedGroup(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Trainers Manager Dialog */}
      {selectedGroup && (
        <GroupTrainersManager
          groupId={selectedGroup.id}
          groupName={selectedGroup.name}
          trainingName={selectedTraining}
          open={showTrainersManager}
          onOpenChange={setShowTrainersManager}
          onUpdate={fetchTrainings}
        />
      )}
    </div>
  );
}
