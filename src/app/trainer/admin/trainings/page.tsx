'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  Trash2,
  ChevronRight,
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

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

interface TrainingGroup {
  id: string;
  name: string;
  athleteCount: number;
  trainerCount: number;
  trainers: { id: string; name: string; isPrimary: boolean }[];
}

interface Training {
  id: string;
  name: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  recurrence: string;
  isActive: boolean;
  groups: TrainingGroup[];
}

export default function AdminTrainingsPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    dayOfWeek: 'MONDAY',
    startTime: '16:00',
    endTime: '17:30',
    recurrence: 'WEEKLY',
  });

  const fetchTrainings = async () => {
    try {
      const res = await fetch('/api/admin/trainings');
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      setTrainings(result.data);
    } catch {
      setError('Fehler beim Laden der Trainings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create');
      }
      
      setIsDialogOpen(false);
      setFormData({
        name: '',
        dayOfWeek: 'MONDAY',
        startTime: '16:00',
        endTime: '17:30',
        recurrence: 'WEEKLY',
      });
      fetchTrainings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Training wirklich löschen? Alle zugehörigen Gruppen und Sessions werden ebenfalls gelöscht.')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/admin/trainings/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchTrainings();
    } catch {
      setError('Fehler beim Löschen');
    }
  };

  // Group trainings by day
  const trainingsByDay = trainings.reduce((acc, training) => {
    if (!acc[training.dayOfWeek]) {
      acc[training.dayOfWeek] = [];
    }
    acc[training.dayOfWeek].push(training);
    return acc;
  }, {} as Record<string, Training[]>);

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trainings verwalten</h1>
          <p className="text-muted-foreground">
            Regelmäßige Trainings und Gruppen konfigurieren
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neues Training
            </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neues Training erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Anfänger Training"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dayOfWeek">Wochentag</Label>
                <Select
                  value={formData.dayOfWeek}
                  onValueChange={(value) => setFormData({ ...formData, dayOfWeek: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_ORDER.map((day) => (
                      <SelectItem key={day} value={day}>
                        {DAY_LABELS[day]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Startzeit</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Endzeit</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="recurrence">Wiederholung</Label>
                <Select
                  value={formData.recurrence}
                  onValueChange={(value) => setFormData({ ...formData, recurrence: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Wöchentlich</SelectItem>
                    <SelectItem value="BIWEEKLY">Alle 2 Wochen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || !formData.name}>
                {isSubmitting ? 'Erstelle...' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

      {trainings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Keine Trainings vorhanden</h3>
            <p className="text-muted-foreground text-center">
              Erstelle ein neues Training, um zu beginnen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {DAY_ORDER.filter((day) => trainingsByDay[day]?.length > 0).map((day) => (
            <div key={day}>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {DAY_LABELS[day]}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {trainingsByDay[day].map((training) => (
                  <Card key={training.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{training.name}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Clock className="h-4 w-4" />
                            {training.startTime} - {training.endTime}
                            {!training.isActive && (
                              <Badge variant="secondary">Inaktiv</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(training.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Gruppen:</span>
                          <span>{training.groups.length}</span>
                        </div>
                        {training.groups.map((group) => (
                          <div
                            key={group.id}
                            className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded"
                          >
                            <div>
                              <span className="font-medium">{group.name}</span>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {group.athleteCount} Athleten
                              </div>
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                              {group.trainers.map((t) => t.name).join(', ') || 'Kein Trainer'}
                            </div>
                          </div>
                        ))}
                        <Link href={`/trainer/admin/trainings/${training.id}`}>
                          <Button variant="outline" size="sm" className="w-full mt-2">
                            Details & Gruppen verwalten
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
