'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Checkbox } from '@/components/ui/checkbox';
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
  UserMinus,
  Users,
  Star,
} from 'lucide-react';
import Link from 'next/link';

interface Trainer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isPrimary?: boolean;
}

interface Group {
  id: string;
  name: string;
  recurringTraining: {
    id: string;
    name: string;
  };
}

export default function GroupTrainersPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [group, setGroup] = useState<Group | null>(null);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [allTrainers, setAllTrainers] = useState<Trainer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);
  const [isPrimary, setIsPrimary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [groupRes, trainersRes, allTrainersRes] = await Promise.all([
        fetch(`/api/admin/groups/${id}`),
        fetch(`/api/admin/groups/${id}/trainers`),
        fetch('/api/admin/trainers'),
      ]);
      
      if (!groupRes.ok || !trainersRes.ok || !allTrainersRes.ok) {
        throw new Error('Failed to fetch');
      }
      
      const groupData = await groupRes.json();
      const trainersData = await trainersRes.json();
      const allTrainersData = await allTrainersRes.json();
      
      setGroup(groupData.data);
      setTrainers(trainersData.data);
      setAllTrainers(allTrainersData.data);
    } catch {
      setError('Fehler beim Laden der Daten');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddTrainer = async () => {
    if (!selectedTrainer) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/groups/${id}/trainers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainerId: selectedTrainer, isPrimary }),
      });
      
      if (!res.ok) throw new Error('Failed to add');
      
      setIsAddDialogOpen(false);
      setSelectedTrainer(null);
      setIsPrimary(false);
      fetchData();
    } catch {
      setError('Fehler beim Hinzufügen');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveTrainer = async (trainerId: string) => {
    if (!confirm('Trainer wirklich aus der Gruppe entfernen?')) return;
    
    try {
      const res = await fetch(`/api/admin/groups/${id}/trainers`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainerId }),
      });
      
      if (!res.ok) throw new Error('Failed to remove');
      fetchData();
    } catch {
      setError('Fehler beim Entfernen');
    }
  };

  // Filter trainers not already in group
  const availableTrainers = allTrainers.filter(
    (t) => !trainers.some((gt) => gt.id === t.id)
  );

  if (isLoading) return <Loading />;
  if (!group) return <div>Gruppe nicht gefunden</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/trainer/admin/trainings/${group.recurringTraining.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{group.name} - Trainer</h1>
          <p className="text-muted-foreground">{group.recurringTraining.name}</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Trainer in dieser Gruppe ({trainers.length})
        </h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={availableTrainers.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Trainer hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Trainer hinzufügen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                {availableTrainers.map((trainer) => (
                  <div
                    key={trainer.id}
                    className={`flex items-center gap-3 p-3 rounded border cursor-pointer ${
                      selectedTrainer === trainer.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedTrainer(trainer.id)}
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {trainer.firstName} {trainer.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {trainer.email}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isPrimary"
                  checked={isPrimary}
                  onCheckedChange={(checked) => setIsPrimary(checked === true)}
                />
                <label htmlFor="isPrimary" className="text-sm">
                  Als Haupttrainer festlegen
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleAddTrainer}
                disabled={isSubmitting || !selectedTrainer}
              >
                {isSubmitting ? 'Füge hinzu...' : 'Hinzufügen'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {trainers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Keine Trainer in dieser Gruppe</h3>
            <p className="text-muted-foreground text-center">
              Füge Trainer hinzu, um sie dieser Trainingsgruppe zuzuweisen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {trainers.map((trainer) => (
                <div
                  key={trainer.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {trainer.firstName} {trainer.lastName}
                        {trainer.isPrimary && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Haupttrainer
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {trainer.email}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveTrainer(trainer.id)}
                  >
                    <UserMinus className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
