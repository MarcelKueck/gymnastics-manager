'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared';
import {
  Calendar,
  Plus,
  Trash2,
  User,
  CheckCircle,
  AlertTriangle,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AbsencePeriod {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  notes?: string;
  isActive: boolean;
  athleteId?: string;
  trainerId?: string;
  athlete?: {
    user: { firstName: string; lastName: string };
  };
  trainer?: {
    user: { firstName: string; lastName: string };
  };
  createdByTrainer?: {
    user: { firstName: string; lastName: string };
  };
  createdAt: string;
}

interface PersonOption {
  id: string;
  name: string;
  type: 'athlete' | 'trainer';
}

export default function AbsencePeriodsPage() {
  const [absencePeriods, setAbsencePeriods] = useState<AbsencePeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [athletes, setAthletes] = useState<PersonOption[]>([]);
  const [trainers, setTrainers] = useState<PersonOption[]>([]);

  // Form state
  const [newPeriod, setNewPeriod] = useState({
    personType: 'athlete' as 'athlete' | 'trainer',
    personId: '',
    startDate: '',
    endDate: '',
    reason: '',
    notes: '',
  });

  useEffect(() => {
    fetchAbsencePeriods();
    fetchPeople();
  }, []);

  const fetchAbsencePeriods = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/absence-periods');
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      setAbsencePeriods(result.data || []);
    } catch {
      setError('Fehler beim Laden der Abwesenheitszeiträume');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPeople = async () => {
    try {
      // Fetch athletes
      const athletesRes = await fetch('/api/admin/athletes');
      if (athletesRes.ok) {
        const athletesData = await athletesRes.json();
        setAthletes(
          (athletesData.data || []).map((a: { id: string; user: { firstName: string; lastName: string } }) => ({
            id: a.id,
            name: `${a.user.firstName} ${a.user.lastName}`,
            type: 'athlete' as const,
          }))
        );
      }

      // Fetch trainers
      const trainersRes = await fetch('/api/admin/trainers');
      if (trainersRes.ok) {
        const trainersData = await trainersRes.json();
        setTrainers(
          (trainersData.data || []).map((t: { id: string; user: { firstName: string; lastName: string } }) => ({
            id: t.id,
            name: `${t.user.firstName} ${t.user.lastName}`,
            type: 'trainer' as const,
          }))
        );
      }
    } catch {
      console.error('Error fetching people');
    }
  };

  const handleCreatePeriod = async () => {
    if (!newPeriod.personId || !newPeriod.startDate || !newPeriod.endDate || !newPeriod.reason) {
      setError('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const body: Record<string, string> = {
        startDate: newPeriod.startDate,
        endDate: newPeriod.endDate,
        reason: newPeriod.reason,
        notes: newPeriod.notes,
      };

      if (newPeriod.personType === 'athlete') {
        body.athleteId = newPeriod.personId;
      } else {
        body.trainerId = newPeriod.personId;
      }

      const res = await fetch('/api/admin/absence-periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to create');

      setSuccessMessage('Abwesenheitszeitraum erfolgreich erstellt');
      setIsDialogOpen(false);
      setNewPeriod({
        personType: 'athlete',
        personId: '',
        startDate: '',
        endDate: '',
        reason: '',
        notes: '',
      });
      fetchAbsencePeriods();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError('Fehler beim Erstellen des Abwesenheitszeitraums');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePeriod = async (id: string) => {
    if (!confirm('Möchten Sie diesen Abwesenheitszeitraum wirklich löschen?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/absence-periods/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      setSuccessMessage('Abwesenheitszeitraum erfolgreich gelöscht');
      fetchAbsencePeriods();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError('Fehler beim Löschen des Abwesenheitszeitraums');
    }
  };

  const handleToggleActive = async (period: AbsencePeriod) => {
    try {
      const res = await fetch(`/api/admin/absence-periods/${period.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !period.isActive }),
      });

      if (!res.ok) throw new Error('Failed to update');

      setSuccessMessage(
        period.isActive
          ? 'Abwesenheitszeitraum deaktiviert'
          : 'Abwesenheitszeitraum aktiviert'
      );
      fetchAbsencePeriods();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError('Fehler beim Aktualisieren des Abwesenheitszeitraums');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getPersonName = (period: AbsencePeriod) => {
    if (period.athlete) {
      return `${period.athlete.user.firstName} ${period.athlete.user.lastName}`;
    }
    if (period.trainer) {
      return `${period.trainer.user.firstName} ${period.trainer.user.lastName}`;
    }
    return 'Unbekannt';
  };

  const getPersonType = (period: AbsencePeriod) => {
    if (period.athleteId) return 'Athlet';
    if (period.trainerId) return 'Trainer';
    return '';
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Abwesenheitszeiträume"
        description="Verwalten Sie Abwesenheitszeiträume für Athleten und Trainer"
      />

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 text-green-800 p-4 rounded-md flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Abwesenheitszeiträume
            </CardTitle>
            <CardDescription>
              {absencePeriods.length} Einträge insgesamt
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Neu erstellen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neuen Abwesenheitszeitraum erstellen</DialogTitle>
                <DialogDescription>
                  Erstellen Sie einen neuen Abwesenheitszeitraum für einen Athleten oder Trainer.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Person *</Label>
                  <Select
                    value={newPeriod.personType}
                    onValueChange={(value: 'athlete' | 'trainer') => {
                      setNewPeriod({ ...newPeriod, personType: value, personId: '' });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Typ auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="athlete">Athlet</SelectItem>
                      <SelectItem value="trainer">Trainer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{newPeriod.personType === 'athlete' ? 'Athlet' : 'Trainer'} *</Label>
                  <Select
                    value={newPeriod.personId}
                    onValueChange={(value) => setNewPeriod({ ...newPeriod, personId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Person auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {(newPeriod.personType === 'athlete' ? athletes : trainers).map(
                        (person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.name}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Startdatum *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newPeriod.startDate}
                      onChange={(e) =>
                        setNewPeriod({ ...newPeriod, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Enddatum *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newPeriod.endDate}
                      onChange={(e) =>
                        setNewPeriod({ ...newPeriod, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Grund *</Label>
                  <Input
                    id="reason"
                    placeholder="z.B. Urlaub, Krankheit, etc."
                    value={newPeriod.reason}
                    onChange={(e) =>
                      setNewPeriod({ ...newPeriod, reason: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notizen</Label>
                  <Input
                    id="notes"
                    placeholder="Optionale Notizen"
                    value={newPeriod.notes}
                    onChange={(e) =>
                      setNewPeriod({ ...newPeriod, notes: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleCreatePeriod} disabled={isSubmitting}>
                  {isSubmitting ? 'Erstelle...' : 'Erstellen'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {absencePeriods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Abwesenheitszeiträume vorhanden
            </div>
          ) : (
            <div className="space-y-4">
              {absencePeriods.map((period) => (
                <div
                  key={period.id}
                  className={`border rounded-lg p-4 ${
                    period.isActive ? 'bg-background' : 'bg-muted/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{getPersonName(period)}</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {getPersonType(period)}
                        </span>
                        {!period.isActive && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                            Inaktiv
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(period.startDate)} - {formatDate(period.endDate)}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Grund:</span> {period.reason}
                      </div>
                      {period.notes && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Notizen:</span> {period.notes}
                        </div>
                      )}
                      {period.createdByTrainer && (
                        <div className="text-xs text-muted-foreground">
                          Erstellt von:{' '}
                          {period.createdByTrainer.user.firstName}{' '}
                          {period.createdByTrainer.user.lastName} am{' '}
                          {formatDate(period.createdAt)}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(period)}
                      >
                        {period.isActive ? 'Deaktivieren' : 'Aktivieren'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePeriod(period.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
