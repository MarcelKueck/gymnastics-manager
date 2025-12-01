'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  UserPlus,
  Trash2,
  Clock,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Montag',
  TUESDAY: 'Dienstag',
  WEDNESDAY: 'Mittwoch',
  THURSDAY: 'Donnerstag',
  FRIDAY: 'Freitag',
  SATURDAY: 'Samstag',
  SUNDAY: 'Sonntag',
};

interface Athlete {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  youthCategory: string;
}

interface Trainer {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface TrainingGroup {
  id: string;
  name: string;
  athleteAssignments: {
    athlete: Athlete;
  }[];
  trainerAssignments: {
    trainer: Trainer;
    isPrimary: boolean;
  }[];
}

interface Training {
  id: string;
  name: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  recurrence: string;
  isActive: boolean;
  trainingGroups: TrainingGroup[];
}

export default function TrainingDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [training, setTraining] = useState<Training | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTraining = async () => {
    try {
      const res = await fetch(`/api/admin/trainings/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      setTraining(result.data);
    } catch {
      setError('Fehler beim Laden des Trainings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTraining();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recurringTrainingId: id,
          name: newGroupName,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to create');
      
      setIsGroupDialogOpen(false);
      setNewGroupName('');
      fetchTraining();
    } catch {
      setError('Fehler beim Erstellen der Gruppe');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Gruppe wirklich löschen?')) return;
    
    try {
      const res = await fetch(`/api/admin/groups/${groupId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchTraining();
    } catch {
      setError('Fehler beim Löschen der Gruppe');
    }
  };

  if (isLoading) return <Loading />;
  if (!training) return <div>Training nicht gefunden</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/trainer/admin/trainings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{training.name}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {DAY_LABELS[training.dayOfWeek]}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {training.startTime} - {training.endTime}
            </span>
            {!training.isActive && <Badge variant="secondary">Inaktiv</Badge>}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Gruppen</h2>
        <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neue Gruppe
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neue Gruppe erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">Gruppenname</Label>
                <Input
                  id="groupName"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="z.B. Anfänger F"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleAddGroup} disabled={isSubmitting || !newGroupName.trim()}>
                {isSubmitting ? 'Erstelle...' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {training.trainingGroups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Keine Gruppen vorhanden</h3>
            <p className="text-muted-foreground text-center">
              Erstelle eine neue Gruppe, um Athleten zuzuweisen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {training.trainingGroups.map((group) => (
            <Card key={group.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteGroup(group.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Trainers */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Trainer</h4>
                    {group.trainerAssignments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Keine Trainer zugewiesen</p>
                    ) : (
                      <div className="space-y-1">
                        {group.trainerAssignments.map((ta) => (
                          <div key={ta.trainer.id} className="flex items-center gap-2 text-sm">
                            <span>{ta.trainer.user.firstName} {ta.trainer.user.lastName}</span>
                            {ta.isPrimary && <Badge variant="secondary">Haupttrainer</Badge>}
                          </div>
                        ))}
                      </div>
                    )}
                    <Link href={`/trainer/admin/groups/${group.id}/trainers`}>
                      <Button variant="outline" size="sm" className="mt-2">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Trainer verwalten
                      </Button>
                    </Link>
                  </div>

                  {/* Athletes */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Athleten ({group.athleteAssignments.length})
                    </h4>
                    {group.athleteAssignments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Keine Athleten zugewiesen</p>
                    ) : (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {group.athleteAssignments.slice(0, 5).map((aa) => (
                          <div key={aa.athlete.id} className="flex items-center gap-2 text-sm">
                            <span>{aa.athlete.user.firstName} {aa.athlete.user.lastName}</span>
                            <Badge variant="outline" className="text-xs">
                              {aa.athlete.youthCategory}
                            </Badge>
                          </div>
                        ))}
                        {group.athleteAssignments.length > 5 && (
                          <p className="text-sm text-muted-foreground">
                            ... und {group.athleteAssignments.length - 5} weitere
                          </p>
                        )}
                      </div>
                    )}
                    <Link href={`/trainer/admin/groups/${group.id}/athletes`}>
                      <Button variant="outline" size="sm" className="mt-2">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Athleten verwalten
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
