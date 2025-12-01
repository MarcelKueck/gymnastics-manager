'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Ban, 
  Undo2, 
  Edit, 
  X, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  List,
  Users,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface SessionTrainer {
  id: string;
  name: string;
  cancelled: boolean;
}

interface ScheduleSession {
  id: string;
  date: string;
  name: string;
  startTime: string;
  endTime: string;
  isCancelled: boolean;
  cancellationReason?: string;
  athleteCancelled: boolean;
  athleteCancellationReason?: string;
  athleteCancellationId?: string;
  isCompleted: boolean;
  attendanceStatus?: 'PRESENT' | 'ABSENT_UNEXCUSED' | 'ABSENT_EXCUSED';
  trainers?: SessionTrainer[];
}

type ViewMode = 'list' | 'calendar';

export default function AthleteSchedule() {
  const [sessions, setSessions] = useState<ScheduleSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  
  // Cancellation form state
  const [cancellingSessionId, setCancellingSessionId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Edit state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editReason, setEditReason] = useState('');
  
  // Undo dialog
  const [undoDialogOpen, setUndoDialogOpen] = useState(false);
  const [undoSession, setUndoSession] = useState<ScheduleSession | null>(null);

  const getWeekStart = useCallback((offset: number) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff + offset * 7);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const startDate = getWeekStart(currentWeekOffset);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      
      const res = await fetch(
        `/api/athlete/schedule?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      setSessions(result.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [currentWeekOffset, getWeekStart]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCancel = async (sessionId: string) => {
    setFormError(null);

    if (cancelReason.length < 10) {
      setFormError('Grund muss mindestens 10 Zeichen haben');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/athlete/cancellations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainingSessionId: sessionId,
          reason: cancelReason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Absagen');
      }

      // Reset form and reload
      setCancellingSessionId(null);
      setCancelReason('');
      await loadData();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (cancellationId: string) => {
    if (editReason.length < 10) {
      setFormError('Grund muss mindestens 10 Zeichen haben');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/athlete/cancellations/${cancellationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: editReason }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setEditingSessionId(null);
      setEditReason('');
      await loadData();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUndo = async () => {
    if (!undoSession?.athleteCancellationId) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/athlete/cancellations/${undoSession.athleteCancellationId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setUndoDialogOpen(false);
      setUndoSession(null);
      await loadData();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) return <div className="text-destructive">Fehler beim Laden: {error}</div>;

  const getStatusBadge = (session: ScheduleSession) => {
    if (session.isCancelled) {
      return <Badge variant="destructive">Training abgesagt</Badge>;
    }
    if (session.athleteCancelled) {
      return <Badge variant="secondary">Abgemeldet</Badge>;
    }
    if (session.isCompleted) {
      switch (session.attendanceStatus) {
        case 'PRESENT':
          return <Badge className="bg-green-500">Anwesend</Badge>;
        case 'ABSENT_UNEXCUSED':
          return <Badge variant="destructive">Abwesend</Badge>;
        case 'ABSENT_EXCUSED':
          return <Badge variant="secondary">Entschuldigt</Badge>;
        default:
          return <Badge variant="outline">Abgeschlossen</Badge>;
      }
    }
    return null;
  };

  const getStatusIcon = (session: ScheduleSession) => {
    if (session.isCancelled) {
      return <XCircle className="h-5 w-5 text-destructive" />;
    }
    if (session.athleteCancelled) {
      return <Ban className="h-5 w-5 text-muted-foreground" />;
    }
    if (session.isCompleted && session.attendanceStatus === 'PRESENT') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (session.isCompleted && (session.attendanceStatus === 'ABSENT_UNEXCUSED' || session.attendanceStatus === 'ABSENT_EXCUSED')) {
      return <XCircle className="h-5 w-5 text-destructive" />;
    }
    return <Calendar className="h-5 w-5 text-primary" />;
  };

  const getWeekDays = () => {
    const start = getWeekStart(currentWeekOffset);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatWeekRange = () => {
    const start = getWeekStart(currentWeekOffset);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const getSessionsForDate = (date: Date) => {
    return sessions.filter((session) => {
      const sessionDate = new Date(session.date);
      return sessionDate.toDateString() === date.toDateString();
    });
  };

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const renderSessionActions = (session: ScheduleSession) => {
    // Can't modify completed or trainer-cancelled sessions
    if (session.isCompleted || session.isCancelled) {
      return null;
    }

    // Session is being cancelled
    if (cancellingSessionId === session.id) {
      return (
        <div className="flex flex-col gap-2 mt-2">
          <Input
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Grund für die Absage (mind. 10 Zeichen)..."
            className="h-8 text-sm"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {cancelReason.length}/10 Zeichen
            </span>
            <div className="flex-1" />
            <Button
              size="sm"
              onClick={() => handleCancel(session.id)}
              disabled={isSubmitting || cancelReason.length < 10}
            >
              {isSubmitting ? 'Wird abgesagt...' : 'Absagen'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCancellingSessionId(null);
                setCancelReason('');
                setFormError(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {formError && (
            <div className="flex items-center gap-2 text-destructive text-xs">
              <AlertCircle className="h-3 w-3" />
              {formError}
            </div>
          )}
        </div>
      );
    }

    // Session reason is being edited
    if (editingSessionId === session.id && session.athleteCancellationId) {
      return (
        <div className="flex flex-col gap-2 mt-2">
          <Input
            value={editReason}
            onChange={(e) => setEditReason(e.target.value)}
            placeholder="Neuer Grund (mind. 10 Zeichen)..."
            className="h-8 text-sm"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {editReason.length}/10 Zeichen
            </span>
            <div className="flex-1" />
            <Button
              size="sm"
              onClick={() => handleEdit(session.athleteCancellationId!)}
              disabled={isSubmitting || editReason.length < 10}
            >
              {isSubmitting ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingSessionId(null);
                setEditReason('');
                setFormError(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {formError && (
            <div className="flex items-center gap-2 text-destructive text-xs">
              <AlertCircle className="h-3 w-3" />
              {formError}
            </div>
          )}
        </div>
      );
    }

    // Athlete has cancelled - show edit/undo buttons
    if (session.athleteCancelled && session.athleteCancellationId) {
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingSessionId(session.id);
              setEditReason(session.athleteCancellationReason || '');
              setFormError(null);
            }}
            title="Grund bearbeiten"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setUndoSession(session);
              setUndoDialogOpen(true);
            }}
            title="Absage zurücknehmen"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    // Session can be cancelled
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setCancellingSessionId(session.id);
          setCancelReason('');
          setFormError(null);
        }}
      >
        Absagen
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with week navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Trainings</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentWeekOffset(0)}
            className="min-w-[200px]"
          >
            {formatWeekRange()}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('list')}
        >
          <List className="h-4 w-4 mr-2" />
          Liste
        </Button>
        <Button
          variant={viewMode === 'calendar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('calendar')}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Kalender
        </Button>
      </div>

      {isLoading ? (
        <Loading />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-10 w-10" />}
          title="Keine Trainings in dieser Woche"
          description="Navigiere zu einer anderen Woche oder du bist noch keiner Trainingsgruppe zugewiesen."
        />
      ) : viewMode === 'list' ? (
        /* List View */
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    'p-4 rounded-lg border',
                    session.isCancelled && 'bg-destructive/5 border-destructive/20',
                    session.athleteCancelled && 'bg-muted/50',
                    !session.isCancelled && !session.athleteCancelled && !session.isCompleted && 'bg-card'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {getStatusIcon(session)}
                      <div>
                        <p className="font-medium">{session.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(session.date)} • {session.startTime} - {session.endTime}
                        </p>
                        {session.trainers && session.trainers.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Users className="h-3 w-3" />
                            <span>
                              {session.trainers.map((t, idx) => (
                                <span key={t.id}>
                                  <span className={t.cancelled ? 'line-through' : ''}>
                                    {t.name}
                                  </span>
                                  {idx < (session.trainers?.length ?? 0) - 1 && ', '}
                                </span>
                              ))}
                            </span>
                          </div>
                        )}
                        {session.athleteCancelled && session.athleteCancellationReason && editingSessionId !== session.id && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Grund: {session.athleteCancellationReason}
                          </p>
                        )}
                        {session.isCancelled && session.cancellationReason && (
                          <p className="text-xs text-destructive mt-1">
                            {session.cancellationReason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(session)}
                      {cancellingSessionId !== session.id && editingSessionId !== session.id && renderSessionActions(session)}
                    </div>
                  </div>
                  {(cancellingSessionId === session.id || editingSessionId === session.id) && (
                    <div className="mt-3 ml-9">
                      {renderSessionActions(session)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Calendar View */
        <div className="grid grid-cols-7 gap-2">
          {getWeekDays().map((day) => {
            const daySessions = getSessionsForDate(day);
            return (
              <div key={day.toISOString()} className="min-h-[180px]">
                <div
                  className={cn(
                    'text-center p-2 rounded-t-lg',
                    isToday(day)
                      ? 'bg-primary text-primary-foreground'
                      : isPast(day)
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-muted'
                  )}
                >
                  <div className="text-xs">
                    {day.toLocaleDateString('de-DE', { weekday: 'short' })}
                  </div>
                  <div className="font-bold">{day.getDate()}</div>
                </div>
                <div className="border border-t-0 rounded-b-lg p-1 space-y-1 min-h-[140px]">
                  {daySessions.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      Kein Training
                    </div>
                  ) : (
                    daySessions.map((session) => (
                      <div
                        key={session.id}
                        className={cn(
                          'p-2 rounded text-xs',
                          session.isCancelled
                            ? 'bg-destructive/20 text-destructive'
                            : session.athleteCancelled
                            ? 'bg-muted text-muted-foreground'
                            : session.isCompleted
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                        )}
                      >
                        <div className="font-medium truncate">{session.name}</div>
                        <div className="flex items-center gap-1 text-[10px] opacity-80">
                          <Clock className="h-3 w-3" />
                          {session.startTime}
                        </div>
                        {session.trainers && session.trainers.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] opacity-70 mt-0.5">
                            <Users className="h-3 w-3" />
                            <span className="truncate">
                              {session.trainers.map(t => t.name.split(' ')[0]).join(', ')}
                            </span>
                          </div>
                        )}
                        {session.athleteCancelled && (
                          <div className="text-[10px] mt-1">Abgemeldet</div>
                        )}
                        {session.isCancelled && (
                          <div className="text-[10px] mt-1">Abgesagt</div>
                        )}
                        {/* Actions for calendar view */}
                        {!session.isCompleted && !session.isCancelled && !isPast(day) && (
                          <div className="mt-2 flex gap-1">
                            {session.athleteCancelled && session.athleteCancellationId ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1 text-[10px]"
                                  onClick={() => {
                                    setEditingSessionId(session.id);
                                    setEditReason(session.athleteCancellationReason || '');
                                    setFormError(null);
                                  }}
                                  title="Bearbeiten"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1 text-[10px]"
                                  onClick={() => {
                                    setUndoSession(session);
                                    setUndoDialogOpen(true);
                                  }}
                                  title="Zurücknehmen"
                                >
                                  <Undo2 className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1 text-[10px]"
                                onClick={() => {
                                  setCancellingSessionId(session.id);
                                  setCancelReason('');
                                  setFormError(null);
                                }}
                              >
                                Absagen
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation/Edit Dialog for Calendar View */}
      {(cancellingSessionId || editingSessionId) && viewMode === 'calendar' && (
        <Card className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-md z-50 shadow-lg">
          <CardContent className="pt-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {cancellingSessionId ? 'Training absagen' : 'Grund bearbeiten'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCancellingSessionId(null);
                    setEditingSessionId(null);
                    setCancelReason('');
                    setEditReason('');
                    setFormError(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={cancellingSessionId ? cancelReason : editReason}
                onChange={(e) => cancellingSessionId ? setCancelReason(e.target.value) : setEditReason(e.target.value)}
                placeholder="Grund eingeben (mind. 10 Zeichen)..."
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {(cancellingSessionId ? cancelReason : editReason).length}/10 Zeichen
                </span>
                <Button
                  size="sm"
                  onClick={() => {
                    if (cancellingSessionId) {
                      handleCancel(cancellingSessionId);
                    } else if (editingSessionId) {
                      const session = sessions.find(s => s.id === editingSessionId);
                      if (session?.athleteCancellationId) {
                        handleEdit(session.athleteCancellationId);
                      }
                    }
                  }}
                  disabled={isSubmitting || (cancellingSessionId ? cancelReason : editReason).length < 10}
                >
                  {isSubmitting ? 'Wird gespeichert...' : cancellingSessionId ? 'Absagen' : 'Speichern'}
                </Button>
              </div>
              {formError && (
                <div className="flex items-center gap-2 text-destructive text-xs">
                  <AlertCircle className="h-3 w-3" />
                  {formError}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
