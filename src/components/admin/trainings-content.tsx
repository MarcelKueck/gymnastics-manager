'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RecurringTrainingForm } from '@/components/admin/recurring-training-form';
import { GroupManager } from '@/components/admin/group-manager';
import { AlertCircle, Plus, Settings, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DAY_OF_WEEK_LABELS } from '@/lib/constants/statuses';

export function AdminTrainingsContent() {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<any | null>(null);

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      const response = await fetch('/api/admin/trainings');
      if (!response.ok) throw new Error('Fehler beim Laden der Trainings');

      const data = await response.json();
      setTrainings(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (formData: any) => {
    try {
      const response = await fetch('/api/admin/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Erstellen');
      }

      toast.success('Training erfolgreich erstellt');
      setShowCreateDialog(false);
      fetchTrainings();
    } catch (err) {
      throw err;
    }
  };

  const handleEdit = async (formData: any) => {
    if (!selectedTraining) return;

    try {
      const response = await fetch(`/api/admin/trainings/${selectedTraining.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Aktualisieren');
      }

      toast.success('Training erfolgreich aktualisiert');
      setShowEditDialog(false);
      setSelectedTraining(null);
      fetchTrainings();
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async (trainingId: string) => {
    if (!confirm('Möchtest du dieses Training wirklich löschen?')) return;

    try {
      const response = await fetch(`/api/admin/trainings/${trainingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Löschen');
      }

      toast.success('Training erfolgreich gelöscht');
      fetchTrainings();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Löschen');
    }
  };

  const handleManageGroups = (training: any) => {
    setSelectedTraining(training);
    setShowGroupManager(true);
  };

  const handleCreateGroup = async (name: string) => {
    if (!selectedTraining) return;

    try {
      const response = await fetch(`/api/admin/trainings/${selectedTraining.id}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Erstellen');
      }

      toast.success('Gruppe erfolgreich erstellt');
      
      // Fetch updated trainings
      await fetchTrainings();
      
      // Update selected training with the new data
      const response2 = await fetch('/api/admin/trainings');
      if (response2.ok) {
        const data = await response2.json();
        const updatedTraining = data.data.find((t: any) => t.id === selectedTraining.id);
        if (updatedTraining) {
          setSelectedTraining(updatedTraining);
        }
      }
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/admin/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Löschen');
      }

      toast.success('Gruppe erfolgreich gelöscht');
      
      // Fetch updated trainings
      await fetchTrainings();
      
      // Update selected training with the new data
      if (selectedTraining) {
        const response2 = await fetch('/api/admin/trainings');
        if (response2.ok) {
          const data = await response2.json();
          const updatedTraining = data.data.find((t: any) => t.id === selectedTraining.id);
          if (updatedTraining) {
            setSelectedTraining(updatedTraining);
          }
        }
      }
    } catch (err) {
      throw err;
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Trainings verwalten</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Wiederkehrende Trainings konfigurieren</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Neues Training
        </Button>
      </div>

      {/* Trainings List */}
      {trainings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            Noch keine Trainings vorhanden
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {trainings.map((training) => (
            <Card key={training.id}>
              <CardHeader>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CardTitle className="text-base sm:text-lg">{training.name}</CardTitle>
                    {!training.isActive && <Badge variant="secondary">Inaktiv</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none"
                      onClick={() => handleManageGroups(training)}
                    >
                      <Users className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Gruppen ({training.groups.length})</span>
                      <span className="sm:hidden">({training.groups.length})</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none"
                      onClick={() => {
                        setSelectedTraining(training);
                        setShowEditDialog(true);
                      }}
                    >
                      <Settings className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Bearbeiten</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(training.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Wochentag</p>
                    <p className="font-medium">
                      {DAY_OF_WEEK_LABELS[training.dayOfWeek as keyof typeof DAY_OF_WEEK_LABELS]}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Uhrzeit</p>
                    <p className="font-medium text-sm">
                      {training.startTime} - {training.endTime}
                    </p>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <p className="text-muted-foreground text-xs">Gruppen</p>
                    <p className="font-medium">{training.groups.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neues Training erstellen</DialogTitle>
          </DialogHeader>
          <RecurringTrainingForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Training bearbeiten</DialogTitle>
          </DialogHeader>
          {selectedTraining && (
            <RecurringTrainingForm
              initialData={selectedTraining}
              onSubmit={handleEdit}
              onCancel={() => {
                setShowEditDialog(false);
                setSelectedTraining(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Group Manager Dialog */}
      <Dialog open={showGroupManager} onOpenChange={setShowGroupManager}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gruppen verwalten</DialogTitle>
          </DialogHeader>
          {selectedTraining && (
            <GroupManager
              recurringTrainingId={selectedTraining.id}
              recurringTrainingName={selectedTraining.name}
              dayOfWeek={DAY_OF_WEEK_LABELS[selectedTraining.dayOfWeek as keyof typeof DAY_OF_WEEK_LABELS]}
              startTime={selectedTraining.startTime}
              endTime={selectedTraining.endTime}
              groups={selectedTraining.groups.map((g: any) => ({
                ...g,
                athleteCount: g.athleteAssignments?.length || 0,
                trainerCount: g.trainerAssignments?.length || 0,
              }))}
              onCreateGroup={handleCreateGroup}
              onDeleteGroup={handleDeleteGroup}
              onReorder={async () => {}}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}