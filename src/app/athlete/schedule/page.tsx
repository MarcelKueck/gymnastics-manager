'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Users, X, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface TrainingSession {
  id: string;
  date: string;
  dayOfWeek: string;
  startTime: string | null;
  endTime: string | null;
  groupNumber: number;
  isCancelled: boolean;
  cancellationReason: string | null;
  recurringTraining: {
    name: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  } | null;
  cancellations: Array<{
    id: string;
    reason: string;
    cancelledAt: string;
  }>;
}

const dayTranslations: Record<string, string> = {
  MONDAY: 'Montag',
  THURSDAY: 'Donnerstag',
  FRIDAY: 'Freitag',
};

export default function AthleteSchedule() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoConfirm, setAutoConfirm] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Cancellation modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchSchedule();
    fetchSettings();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/athlete/schedule?limit=30');
      if (!response.ok) throw new Error('Failed to load schedule');
      const data = await response.json();
      setSessions(data.sessions);
    } catch (err) {
      setError('Fehler beim Laden der Trainingstermine');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/athlete/settings');
      if (response.ok) {
        const data = await response.json();
        setAutoConfirm(data.autoConfirmFutureSessions);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleAutoConfirmToggle = async () => {
    try {
      setLoadingSettings(true);
      const response = await fetch('/api/athlete/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoConfirmFutureSessions: !autoConfirm }),
      });

      if (!response.ok) throw new Error('Failed to update settings');

      setAutoConfirm(!autoConfirm);
    } catch (err) {
      alert('Fehler beim Aktualisieren der Einstellungen');
      console.error(err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const openCancelModal = (session: TrainingSession) => {
    setSelectedSession(session);
    setCancelReason('');
    setCancelError(null);
    setCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    setCancelModalOpen(false);
    setSelectedSession(null);
    setCancelReason('');
    setCancelError(null);
  };

  const handleCancelSession = async () => {
    if (!selectedSession) return;

    // Validate reason length
    if (cancelReason.trim().length < 10) {
      setCancelError('Grund muss mindestens 10 Zeichen lang sein');
      return;
    }

    try {
      setCancelling(true);
      setCancelError(null);

      const response = await fetch('/api/athlete/cancellations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainingSessionId: selectedSession.id,
          reason: cancelReason.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel session');
      }

      // Refresh schedule
      await fetchSchedule();
      closeCancelModal();
    } catch (err: any) {
      setCancelError(err.message || 'Fehler beim Absagen des Trainings');
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  const handleUndoCancel = async (cancellationId: string) => {
    if (!confirm('Absage wirklich rückgängig machen?')) return;

    try {
      const response = await fetch(`/api/athlete/cancellations/${cancellationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to undo cancellation');

      // Refresh schedule
      await fetchSchedule();
    } catch (err) {
      alert('Fehler beim Rückgängigmachen der Absage');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Trainingstermine...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  const now = new Date();
  const upcomingSessions = sessions.filter((s) => new Date(s.date) >= now);

  return (
    <div className="space-y-6">
      {/* Header with auto-confirm toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nächste Termine</h1>
          <p className="text-sm text-gray-600 mt-1">
            Deine kommenden Trainingstermine
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
          <Label htmlFor="auto-confirm" className="text-sm cursor-pointer">
            Auto-Bestätigung
          </Label>
          <button
            id="auto-confirm"
            onClick={handleAutoConfirmToggle}
            disabled={loadingSettings}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
              autoConfirm ? 'bg-teal-600' : 'bg-gray-200'
            } ${loadingSettings ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoConfirm ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Auto-confirm info */}
      {autoConfirm && (
        <Alert variant="success">
          <CheckCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">Auto-Bestätigung aktiviert</p>
            <p className="text-sm mt-1">
              Alle zukünftigen Trainings werden automatisch bestätigt. Du kannst
              einzelne Termine weiterhin absagen.
            </p>
          </div>
        </Alert>
      )}

      {/* Sessions list */}
      {upcomingSessions.length === 0 ? (
        <Alert variant="default">
          <p>Keine kommenden Trainingstermine gefunden.</p>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingSessions.map((session) => {
            const isCancelledByAthlete = session.cancellations.length > 0;
            const isCancelledByAdmin = session.isCancelled;
            const isCancelled = isCancelledByAthlete || isCancelledByAdmin;
            const isPast = new Date(session.date) < now;

            return (
              <Card key={session.id} className={isCancelled ? 'bg-red-50 border-red-200' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {dayTranslations[session.dayOfWeek]}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {format(new Date(session.date), 'dd.MM.yyyy', { locale: de })}
                      </p>
                    </div>
                    {isCancelled && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Abgesagt
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {session.startTime && session.endTime && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>{session.startTime} - {session.endTime}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      <span>Gruppe {session.groupNumber}</span>
                    </div>
                  </div>

                  {isCancelledByAdmin && (
                    <div className="bg-white rounded-md p-3 border border-red-200">
                      <p className="text-sm font-medium text-red-900 mb-1">
                        Training wurde vom Admin abgesagt
                      </p>
                      {session.cancellationReason && (
                        <p className="text-sm text-gray-700">{session.cancellationReason}</p>
                      )}
                    </div>
                  )}

                  {isCancelledByAthlete && !isCancelledByAdmin && (
                    <div className="bg-white rounded-md p-3 border border-red-200">
                      <p className="text-sm font-medium text-red-900 mb-1">Deine Absage:</p>
                      <p className="text-sm text-gray-700">{session.cancellations[0].reason}</p>
                      {!isPast && (
                        <button
                          onClick={() => handleUndoCancel(session.cancellations[0].id)}
                          className="mt-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
                        >
                          Absage rückgängig machen
                        </button>
                      )}
                    </div>
                  )}

                  {!isCancelled && !isPast && !isCancelledByAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCancelModal(session)}
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Training absagen
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Training absagen</h3>
              <button
                onClick={closeCancelModal}
                className="text-gray-400 hover:text-gray-600"
                disabled={cancelling}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <div className="bg-gray-50 rounded-md p-3 mb-4">
                <p className="text-sm font-medium text-gray-900">
                  {dayTranslations[selectedSession.dayOfWeek]},{' '}
                  {format(new Date(selectedSession.date), 'dd.MM.yyyy', { locale: de })}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedSession.startTime && selectedSession.endTime && (
                    <span>{selectedSession.startTime} - {selectedSession.endTime} • </span>
                  )}
                  Gruppe {selectedSession.groupNumber}
                </p>
              </div>

              <Alert variant="warning" className="mb-4">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm">
                  Bitte gib einen <strong>Grund für die Absage</strong> an (mindestens 10 Zeichen).
                </p>
              </Alert>

              <div>
                <Label htmlFor="cancel-reason" className="mb-2 block">
                  Absagegrund <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="cancel-reason"
                  placeholder="z.B. Krankheit, Arzttermin, Familienfeier..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={4}
                  disabled={cancelling}
                  className={cancelError ? 'border-red-500' : ''}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {cancelReason.length} / mindestens 10 Zeichen
                </p>
                {cancelError && (
                  <p className="text-sm text-red-600 mt-2">{cancelError}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={closeCancelModal}
                disabled={cancelling}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelSession}
                disabled={cancelling || cancelReason.trim().length < 10}
                className="flex-1"
              >
                {cancelling ? 'Wird abgesagt...' : 'Training absagen'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}