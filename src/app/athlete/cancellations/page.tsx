'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Calendar, Clock, Ban, Undo2, Edit, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Cancellation {
  id: string;
  reason: string;
  cancelledAt: string;
  trainingSession: {
    id: string;
    date: string;
    name: string;
    startTime: string;
    endTime: string;
  };
}

interface UpcomingSession {
  id: string;
  date: string;
  name: string;
  startTime: string;
  endTime: string;
}

export default function AthleteCancellations() {
  const searchParams = useSearchParams();
  const preSelectedSession = searchParams.get('session');

  const [cancellations, setCancellations] = useState<Cancellation[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [selectedSessionId, setSelectedSessionId] = useState(preSelectedSession || '');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editReason, setEditReason] = useState('');
  
  // Undo dialog
  const [undoDialogOpen, setUndoDialogOpen] = useState(false);
  const [undoCancellationId, setUndoCancellationId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [cancellationsRes, scheduleRes] = await Promise.all([
        fetch('/api/athlete/cancellations'),
        fetch('/api/athlete/schedule?weeks=4'),
      ]);

      if (!cancellationsRes.ok || !scheduleRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [cancellationsData, scheduleData] = await Promise.all([
        cancellationsRes.json(),
        scheduleRes.json(),
      ]);

      setCancellations(cancellationsData.data);

      // Filter out already cancelled sessions and completed sessions
      const cancelledIds = new Set(cancellationsData.data.map((c: Cancellation) => c.trainingSession.id));
      const availableSessions = scheduleData.data.filter(
        (s: UpcomingSession & { isCancelled: boolean; isCompleted: boolean; athleteCancelled: boolean }) => 
          !s.isCancelled && !s.isCompleted && !s.athleteCancelled && !cancelledIds.has(s.id)
      );
      setUpcomingSessions(availableSessions);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedSessionId) {
      setFormError('Bitte wähle ein Training aus');
      return;
    }

    if (reason.length < 10) {
      setFormError('Grund muss mindestens 10 Zeichen haben');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/athlete/cancellations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainingSessionId: selectedSessionId,
          reason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Absagen');
      }

      // Reset form and reload
      setSelectedSessionId('');
      setReason('');
      await loadData();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (id: string) => {
    if (editReason.length < 10) {
      return;
    }

    try {
      const res = await fetch(`/api/athlete/cancellations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: editReason }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setEditingId(null);
      await loadData();
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  const handleUndo = async () => {
    if (!undoCancellationId) return;

    try {
      const res = await fetch(`/api/athlete/cancellations/${undoCancellationId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setUndoDialogOpen(false);
      setUndoCancellationId(null);
      await loadData();
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <div className="text-destructive">Fehler beim Laden: {error}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Trainingsabsagen</h1>

      {/* New Cancellation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Training absagen</CardTitle>
          <CardDescription>
            Wähle ein Training aus und gib einen Grund an (mindestens 10 Zeichen)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingSessions.length === 0 ? (
            <p className="text-muted-foreground">
              Keine Trainings zum Absagen verfügbar
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session">Training</Label>
                <select
                  id="session"
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Training auswählen...</option>
                  {upcomingSessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {formatDate(session.date)} - {session.name} ({session.startTime})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Grund</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Grund für die Absage eingeben..."
                  minLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  {reason.length}/10 Zeichen (mindestens)
                </p>
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {formError}
                </div>
              )}

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Wird abgesagt...' : 'Training absagen'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Active Cancellations */}
      <Card>
        <CardHeader>
          <CardTitle>Aktive Absagen</CardTitle>
          <CardDescription>
            Du kannst Absagen bearbeiten oder zurücknehmen, solange die Frist nicht überschritten ist
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cancellations.length === 0 ? (
            <EmptyState
              icon={<Ban className="h-10 w-10" />}
              title="Keine aktiven Absagen"
              description="Du hast aktuell keine Trainings abgesagt"
            />
          ) : (
            <div className="space-y-4">
              {cancellations.map((cancellation) => (
                <div
                  key={cancellation.id}
                  className="flex items-start justify-between p-4 rounded-lg border bg-muted/30"
                >
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center justify-center w-14 h-14 bg-background rounded-md border">
                      <span className="text-xs text-muted-foreground">
                        {new Date(cancellation.trainingSession.date).toLocaleDateString('de-DE', { weekday: 'short' })}
                      </span>
                      <span className="font-bold">
                        {new Date(cancellation.trainingSession.date).getDate()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">{cancellation.trainingSession.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(cancellation.trainingSession.date)}
                        <Clock className="h-3 w-3 ml-2" />
                        {cancellation.trainingSession.startTime} - {cancellation.trainingSession.endTime}
                      </p>
                      
                      {editingId === cancellation.id ? (
                        <div className="flex gap-2 mt-2">
                          <Input
                            value={editReason}
                            onChange={(e) => setEditReason(e.target.value)}
                            className="h-8 text-sm"
                            placeholder="Neuer Grund..."
                          />
                          <Button
                            size="sm"
                            onClick={() => handleEdit(cancellation.id)}
                            disabled={editReason.length < 10}
                          >
                            Speichern
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            Abbrechen
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm mt-1">
                          <span className="text-muted-foreground">Grund:</span> {cancellation.reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {editingId !== cancellation.id && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingId(cancellation.id);
                          setEditReason(cancellation.reason);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUndoCancellationId(cancellation.id);
                          setUndoDialogOpen(true);
                        }}
                      >
                        <Undo2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Undo Confirmation Dialog */}
      <ConfirmDialog
        open={undoDialogOpen}
        onOpenChange={setUndoDialogOpen}
        title="Absage zurücknehmen?"
        description="Möchtest du die Absage wirklich zurücknehmen? Du wirst dann wieder als teilnehmend geführt."
        confirmLabel="Zurücknehmen"
        onConfirm={handleUndo}
      />
    </div>
  );
}
