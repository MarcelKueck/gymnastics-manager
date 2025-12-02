'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loading } from '@/components/ui/loading';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  Calendar,
  User,
  UserCog,
  Bandage,
  Plane,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface AbsencePeriod {
  id: string;
  reason: string;
  notes: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  athleteId: string | null;
  trainerId: string | null;
  athlete: {
    user: { firstName: string; lastName: string };
  } | null;
  trainer: {
    user: { firstName: string; lastName: string };
  } | null;
  createdByTrainer: {
    user: { firstName: string; lastName: string };
  };
  createdAt: string;
}

interface UserOption {
  id: string;
  name: string;
  type: 'athlete' | 'trainer';
}

export default function AdminAbsencePeriodsPage() {
  const [absencePeriods, setAbsencePeriods] = useState<AbsencePeriod[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<AbsencePeriod | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [reason, setReason] = useState<string>('INJURY');
  const [notes, setNotes] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchData = async () => {
    try {
      const [periodsRes, usersRes] = await Promise.all([
        fetch('/api/admin/absence-periods'),
        fetch('/api/admin/users'),
      ]);

      if (periodsRes.ok) {
        const result = await periodsRes.json();
        setAbsencePeriods(result.data || []);
      }

      if (usersRes.ok) {
        const usersResult = await usersRes.json();
        const userOptions: UserOption[] = [];

        // Add athletes
        (usersResult.data || []).forEach((user: {
          id: string;
          firstName: string;
          lastName: string;
          athleteProfile?: { id: string };
          trainerProfile?: { id: string };
        }) => {
          if (user.athleteProfile) {
            userOptions.push({
              id: `athlete_${user.athleteProfile.id}`,
              name: `${user.firstName} ${user.lastName} (Athlet)`,
              type: 'athlete',
            });
          }
          if (user.trainerProfile) {
            userOptions.push({
              id: `trainer_${user.trainerProfile.id}`,
              name: `${user.firstName} ${user.lastName} (Trainer)`,
              type: 'trainer',
            });
          }
        });

        setUsers(userOptions);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Fehler beim Laden der Daten');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setSelectedUserId('');
    setReason('INJURY');
    setNotes('');
    setStartDate('');
    setEndDate('');
    setEditingPeriod(null);
    setError(null);
  };

  const openEditDialog = (period: AbsencePeriod) => {
    setEditingPeriod(period);
    if (period.athleteId) {
      setSelectedUserId(`athlete_${period.athleteId}`);
    } else if (period.trainerId) {
      setSelectedUserId(`trainer_${period.trainerId}`);
    }
    setReason(period.reason);
    setNotes(period.notes || '');
    setStartDate(format(new Date(period.startDate), 'yyyy-MM-dd'));
    setEndDate(format(new Date(period.endDate), 'yyyy-MM-dd'));
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Parse user ID
      const [type, id] = selectedUserId.split('_');
      const payload = {
        athleteId: type === 'athlete' ? id : null,
        trainerId: type === 'trainer' ? id : null,
        reason,
        notes: notes || null,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      };

      const url = editingPeriod
        ? `/api/admin/absence-periods/${editingPeriod.id}`
        : '/api/admin/absence-periods';

      const res = await fetch(url, {
        method: editingPeriod ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Fehler beim Speichern');
      }

      setDialogOpen(false);
      resetForm();
      await fetchData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/absence-periods/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Fehler beim Löschen');
      }

      setDeleteConfirmId(null);
      await fetchData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case 'INJURY':
        return (
          <Badge variant="destructive" className="gap-1">
            <Bandage className="h-3 w-3" />
            Verletzung
          </Badge>
        );
      case 'VACATION':
        return (
          <Badge variant="secondary" className="gap-1">
            <Plane className="h-3 w-3" />
            Urlaub
          </Badge>
        );
      default:
        return <Badge variant="outline">{reason}</Badge>;
    }
  };

  const isActiveNow = (period: AbsencePeriod) => {
    const now = new Date();
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    return period.isActive && now >= start && now <= end;
  };

  if (isLoading) {
    return <Loading />;
  }

  // Separate active (current/future) and past periods
  const now = new Date();
  const activePeriods = absencePeriods.filter(
    (p) => p.isActive && new Date(p.endDate) >= now
  );
  const pastPeriods = absencePeriods.filter(
    (p) => !p.isActive || new Date(p.endDate) < now
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Abwesenheitszeiten"
        description="Verwalte Verletzungs- und Urlaubszeiten von Athleten und Trainern"
      />

      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Abwesenheit hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingPeriod ? 'Abwesenheit bearbeiten' : 'Neue Abwesenheit'}
                </DialogTitle>
                <DialogDescription>
                  Füge eine Abwesenheitszeit für einen Athleten oder Trainer hinzu.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="user">Person</Label>
                  <Select
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                    disabled={!!editingPeriod}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Person auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="reason">Grund</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INJURY">Verletzung</SelectItem>
                      <SelectItem value="VACATION">Urlaub</SelectItem>
                      <SelectItem value="OTHER">Sonstiges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Von</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="endDate">Bis</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notizen (optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Zusätzliche Informationen..."
                    rows={3}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Abbrechen
                </Button>
                <Button type="submit" disabled={isSubmitting || !selectedUserId || !startDate || !endDate}>
                  {isSubmitting ? 'Speichern...' : editingPeriod ? 'Speichern' : 'Hinzufügen'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Periods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Aktive Abwesenheiten
          </CardTitle>
          <CardDescription>
            {activePeriods.length} aktive Abwesenheit(en)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activePeriods.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Keine aktiven Abwesenheiten
            </p>
          ) : (
            <div className="space-y-4">
              {activePeriods.map((period) => (
                <div
                  key={period.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    isActiveNow(period)
                      ? 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800'
                      : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      period.athleteId ? 'bg-blue-100 dark:bg-blue-900' : 'bg-purple-100 dark:bg-purple-900'
                    }`}>
                      {period.athleteId ? (
                        <User className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                      ) : (
                        <UserCog className="h-5 w-5 text-purple-700 dark:text-purple-300" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {period.athlete
                          ? `${period.athlete.user.firstName} ${period.athlete.user.lastName}`
                          : period.trainer
                          ? `${period.trainer.user.firstName} ${period.trainer.user.lastName}`
                          : 'Unbekannt'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {getReasonBadge(period.reason)}
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(period.startDate), 'dd.MM.yyyy', { locale: de })} –{' '}
                          {format(new Date(period.endDate), 'dd.MM.yyyy', { locale: de })}
                        </span>
                        {isActiveNow(period) && (
                          <Badge variant="outline" className="text-amber-700 border-amber-300">
                            Aktuell
                          </Badge>
                        )}
                      </div>
                      {period.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{period.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(period)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {deleteConfirmId === period.id ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(period.id)}
                          disabled={isSubmitting}
                        >
                          Löschen
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Abbrechen
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirmId(period.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Periods */}
      {pastPeriods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-5 w-5" />
              Vergangene Abwesenheiten
            </CardTitle>
            <CardDescription>
              {pastPeriods.length} vergangene Abwesenheit(en)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pastPeriods.slice(0, 10).map((period) => (
                <div
                  key={period.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted/20 opacity-70"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      {period.athleteId ? (
                        <User className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <UserCog className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {period.athlete
                          ? `${period.athlete.user.firstName} ${period.athlete.user.lastName}`
                          : period.trainer
                          ? `${period.trainer.user.firstName} ${period.trainer.user.lastName}`
                          : 'Unbekannt'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {getReasonBadge(period.reason)}
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(period.startDate), 'dd.MM.yyyy', { locale: de })} –{' '}
                          {format(new Date(period.endDate), 'dd.MM.yyyy', { locale: de })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
