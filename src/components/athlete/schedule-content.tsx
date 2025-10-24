'use client';

import { useEffect, useState } from 'react';
import { ScheduleCalendar } from '@/components/athlete/schedule-calendar';
import { CancellationForm } from '@/components/athlete/cancellation-form';
import { EditCancellationDialog } from '@/components/athlete/edit-cancellation-dialog';
import { BulkCancellationDialog } from '@/components/athlete/bulk-cancellation-dialog';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';

export function AthleteScheduleContent() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [showCancellationDialog, setShowCancellationDialog] = useState(false);
  const [editCancellation, setEditCancellation] = useState<{
    id: string;
    session: any;
    reason: string;
  } | null>(null);
  const [deadlineHours, setDeadlineHours] = useState(2);

  useEffect(() => {
    fetchSchedule();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/athlete/settings');
      if (response.ok) {
        const data = await response.json();
        setDeadlineHours(data.data.cancellationDeadlineHours);
      }
    } catch (err) {
      // Use default if fetch fails
      console.error('Failed to fetch settings:', err);
    }
  };

  const fetchSchedule = async () => {
    try {
      const response = await fetch('/api/athlete/schedule');
      if (!response.ok) throw new Error('Fehler beim Laden des Trainingsplans');

      const data = await response.json();
      setSessions(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setSelectedSession(session);
      setShowCancellationDialog(true);
    }
  };

  const handleEditCancellation = (cancellationId: string, session: any) => {
    const activeCancellation = session.cancellations?.find((c: any) => c.isActive);
    if (activeCancellation) {
      setEditCancellation({
        id: cancellationId,
        session,
        reason: activeCancellation.reason,
      });
    }
  };

  const handleSubmitCancellation = async (sessionId: string, reason: string) => {
    try {
      const response = await fetch('/api/athlete/cancellations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainingSessionId: sessionId, reason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Absagen');
      }

      toast.success('Training erfolgreich abgesagt');
      setShowCancellationDialog(false);
      setSelectedSession(null);
      fetchSchedule();
    } catch (err) {
      throw err; // Let the form handle the error
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trainingsplan</h1>
          <p className="text-muted-foreground">Deine kommenden Trainingseinheiten</p>
        </div>
        <BulkCancellationDialog onSuccess={fetchSchedule} />
      </div>

      <ScheduleCalendar
        sessions={sessions}
        onCancelSession={handleCancelSession}
        onEditCancellation={handleEditCancellation}
        deadlineHours={deadlineHours}
      />

      <Dialog open={showCancellationDialog} onOpenChange={setShowCancellationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Training absagen</DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <CancellationForm
              sessionId={selectedSession.id}
              sessionName={selectedSession.recurringTraining?.name || 'Training'}
              sessionDate={formatDate(selectedSession.date)}
              onSubmit={handleSubmitCancellation}
              onCancel={() => {
                setShowCancellationDialog(false);
                setSelectedSession(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {editCancellation && (
        <EditCancellationDialog
          open={!!editCancellation}
          onOpenChange={(open) => !open && setEditCancellation(null)}
          cancellationId={editCancellation.id}
          sessionName={editCancellation.session.recurringTraining?.name || 'Training'}
          sessionDate={formatDate(editCancellation.session.date)}
          currentReason={editCancellation.reason}
          onSuccess={() => {
            setEditCancellation(null);
            fetchSchedule();
          }}
        />
      )}
    </div>
  );
}