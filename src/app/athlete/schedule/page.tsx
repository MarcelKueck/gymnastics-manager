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
  X, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  List,
  Users,
  Check,
  Dumbbell,
  Eye,
  EyeOff,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface SessionTrainer {
  id: string;
  name: string;
  cancelled: boolean;
}

interface GroupScheduleSession {
  id: string;
  sessionId: string;
  recurringTrainingId: string;
  trainingGroupId: string;
  groupName: string;
  date: string;
  trainingName: string;
  startTime: string;
  endTime: string;
  isCancelled: boolean;
  cancellationReason?: string;
  athleteCancelled: boolean;
  athleteCancellationId?: string;
  athleteCancellationReason?: string;
  isCompleted: boolean;
  attendanceStatus?: 'PRESENT' | 'ABSENT_UNEXCUSED' | 'ABSENT_EXCUSED';
  isLate?: boolean;
  equipment: string | null;
  trainers: SessionTrainer[];
  confirmed: boolean | null;
  confirmedAt: string | null;
  declineReason?: string | null;
  totalAthletes: number;
  confirmedAthletes: number;
  declinedAthletes: number;
}

type ViewMode = 'list' | 'calendar';

export default function AthleteSchedule() {
  const [sessions, setSessions] = useState<GroupScheduleSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [showPastSessions, setShowPastSessions] = useState(false);
  
  // Cancellation form state
  const [cancellingSessionId, setCancellingSessionId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Edit state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editReason, setEditReason] = useState('');
  
  // Confirmation state
  const [confirmingSessionId, setConfirmingSessionId] = useState<string | null>(null);
  const [cancellationDeadlineHours, setCancellationDeadlineHours] = useState<number>(2);
  const [confirmationMode, setConfirmationMode] = useState<'AUTO_CONFIRM' | 'REQUIRE_CONFIRMATION'>('AUTO_CONFIRM');
  
  // Undo dialog
  const [undoDialogOpen, setUndoDialogOpen] = useState(false);
  const [undoSession, setUndoSession] = useState<GroupScheduleSession | null>(null);

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

  // Fetch system settings for deadline
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings/public');
        if (res.ok) {
          const result = await res.json();
          setCancellationDeadlineHours(result.data.cancellationDeadlineHours || 2);
          setConfirmationMode(result.data.attendanceConfirmationMode || 'AUTO_CONFIRM');
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
    };
    fetchSettings();
  }, []);

  // Check if session is within deadline
  const isWithinDeadline = useCallback((session: GroupScheduleSession) => {
    const sessionDate = new Date(session.date);
    const [hours, minutes] = session.startTime.split(':').map(Number);
    sessionDate.setHours(hours, minutes, 0, 0);
    
    const deadlineTime = new Date(sessionDate);
    deadlineTime.setHours(deadlineTime.getHours() - cancellationDeadlineHours);
    
    return new Date() <= deadlineTime;
  }, [cancellationDeadlineHours]);

  // Handle session confirmation/decline
  const handleConfirmSession = async (sessionId: string, confirmed: boolean, declineReason?: string) => {
    setConfirmingSessionId(sessionId);
    setFormError(null);
    try {
      console.log('[ConfirmSession] Sending:', { sessionId, confirmed, declineReason });
      const res = await fetch('/api/session-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, confirmed, declineReason }),
      });

      const data = await res.json();
      console.log('[ConfirmSession] Response:', data);

      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Speichern');
      }

      // Update local state with adjusted counts
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          const wasConfirmed = confirmationMode === 'AUTO_CONFIRM' 
            ? s.confirmed !== false 
            : s.confirmed === true;
          const wasDeclined = s.confirmed === false;
          
          let newConfirmedCount = s.confirmedAthletes;
          let newDeclinedCount = s.declinedAthletes;
          
          if (confirmed) {
            if (wasDeclined) newDeclinedCount--;
            if (!wasConfirmed) newConfirmedCount++;
          } else {
            if (wasConfirmed) newConfirmedCount--;
            if (!wasDeclined) newDeclinedCount++;
          }
          
          return {
            ...s,
            confirmed,
            confirmedAt: new Date().toISOString(),
            declineReason: declineReason || null,
            confirmedAthletes: Math.max(0, newConfirmedCount),
            declinedAthletes: Math.max(0, newDeclinedCount),
          };
        }
        return s;
      }));
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setConfirmingSessionId(null);
    }
  };

  const handleCancelSession = async (sessionId: string, reason: string) => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch('/api/athlete/cancellations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, reason }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Absagen');
      }

      // Show late warning if applicable
      if (data.isLate) {
        alert(data.message);
      }

      setCancellingSessionId(null);
      setCancelReason('');
      loadData();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUndoCancellation = async (session: GroupScheduleSession) => {
    if (!session.athleteCancellationId) return;
    
    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/athlete/cancellations/${session.athleteCancellationId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Rückgängigmachen');
      }

      setUndoDialogOpen(false);
      setUndoSession(null);
      loadData();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCancellation = async (sessionId: string, cancellationId: string, newReason: string) => {
    if (!cancellationId) return;
    
    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/athlete/cancellations/${cancellationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: newReason }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Bearbeiten');
      }

      setEditingSessionId(null);
      setEditReason('');
      loadData();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatWeekRange = () => {
    const start = getWeekStart(currentWeekOffset);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const getAttendanceBadge = (session: GroupScheduleSession) => {
    if (session.isCompleted && session.attendanceStatus) {
      switch (session.attendanceStatus) {
        case 'PRESENT':
          return <Badge className="bg-emerald-500">{session.isLate ? 'Verspätet' : 'Anwesend'}</Badge>;
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

  const getStatusIcon = (session: GroupScheduleSession) => {
    if (session.isCancelled) {
      return <XCircle className="h-5 w-5 text-destructive" />;
    }
    if (session.athleteCancelled) {
      return <Ban className="h-5 w-5 text-muted-foreground" />;
    }
    if (session.isCompleted && session.attendanceStatus === 'PRESENT') {
      return <CheckCircle className="h-5 w-5 text-emerald-500" />;
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

  // Check if a session is in the past
  const isSessionPast = (session: GroupScheduleSession) => {
    const sessionDate = new Date(session.date);
    sessionDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sessionDate < today;
  };

  // Filter sessions based on showPastSessions toggle
  const filteredSessions = sessions.filter((session) => {
    if (showPastSessions) return true;
    return !isSessionPast(session);
  });

  // Check if there are any past sessions to show the toggle
  const hasPastSessions = sessions.some((session) => isSessionPast(session));

  const renderSessionActions = (session: GroupScheduleSession) => {
    // Can't modify completed or trainer-cancelled sessions
    if (session.isCompleted || session.isCancelled) {
      return null;
    }

    // Check if within deadline
    const canModify = isWithinDeadline(session);
    const isLoading = confirmingSessionId === session.id;
    
    // Determine the effective confirmed status based on confirmation mode
    // In AUTO_CONFIRM mode: null means confirmed (coming by default)
    // In REQUIRE_CONFIRMATION mode: null means not yet responded
    const effectiveConfirmed = confirmationMode === 'AUTO_CONFIRM' 
      ? (session.confirmed === false ? false : true) // null or true = confirmed
      : session.confirmed; // null = not responded, true = confirmed, false = declined
    
    // Past deadline - show current status as read-only
    if (!canModify) {
      if (effectiveConfirmed === true) {
        return (
          <Badge className="bg-emerald-500">
            <Check className="h-3 w-3 mr-1" />
            Zugesagt
          </Badge>
        );
      } else if (effectiveConfirmed === false) {
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Abgesagt
          </Badge>
        );
      }
      // REQUIRE_CONFIRMATION mode and no response
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Nicht bestätigt
        </Badge>
      );
    }

    // AUTO_CONFIRM mode: Only show cancel button, user is assumed to be coming
    if (confirmationMode === 'AUTO_CONFIRM') {
      const isCancelled = session.confirmed === false;
      
      if (isCancelled) {
        // User has cancelled - show "undo" option
        return (
          <div className="flex items-center gap-2">
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              Abgesagt
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleConfirmSession(session.id, true)}
              disabled={isLoading}
              className="hover:bg-emerald-100 hover:text-emerald-700 hover:border-emerald-300"
              title="Doch dabei"
            >
              {isLoading ? (
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
          </div>
        );
      }
      
      // User is coming (default) - show cancel button
      return (
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500">
            <Check className="h-3 w-3 mr-1" />
            Dabei
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleConfirmSession(session.id, false)}
            disabled={isLoading}
            className="hover:bg-red-100 hover:text-red-700 hover:border-red-300"
            title="Absagen"
          >
            {isLoading ? (
              <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
          </Button>
        </div>
      );
    }

    // REQUIRE_CONFIRMATION mode: Show two buttons, user must actively choose
    return (
      <div className="flex gap-1">
        <Button
          variant={session.confirmed === true ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleConfirmSession(session.id, true)}
          disabled={isLoading || session.confirmed === true}
          className={session.confirmed === true ? 'bg-emerald-600 hover:bg-emerald-700' : 'hover:bg-emerald-100 hover:text-emerald-700 hover:border-emerald-300'}
          title="Zusagen"
        >
          {isLoading && session.confirmed !== true ? (
            <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant={session.confirmed === false ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => handleConfirmSession(session.id, false)}
          disabled={isLoading || session.confirmed === false}
          className={session.confirmed !== false ? 'hover:bg-red-100 hover:text-red-700 hover:border-red-300' : ''}
          title="Absagen"
        >
          {isLoading && session.confirmed === true ? (
            <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  };

  if (error) {
    return (
      <div className="p-4 text-destructive">
        Fehler beim Laden: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Week Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
            className="h-10 w-10"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentWeekOffset(0)}
            className="min-w-[180px] sm:min-w-[200px] h-10"
          >
            {formatWeekRange()}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
            className="h-10 w-10"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Toggle for past sessions */}
          {hasPastSessions && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPastSessions(!showPastSessions)}
              className="flex items-center gap-2"
            >
              {showPastSessions ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Vergangene ausblenden
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Vergangene anzeigen
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('list')}
          className="h-10"
        >
          <List className="h-4 w-4 mr-2" />
          Liste
        </Button>
        <Button
          variant={viewMode === 'calendar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('calendar')}
          className="h-10 hidden sm:flex"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Kalender
        </Button>
      </div>

      {/* Form Error Display */}
      {formError && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{formError}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-auto h-6 px-2"
            onClick={() => setFormError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isLoading ? (
        <Loading />
      ) : filteredSessions.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title={sessions.length === 0 
            ? "Keine Trainings in dieser Woche"
            : "Keine anstehenden Trainings in dieser Woche"}
          description={sessions.length === 0 
            ? "Navigiere zu einer anderen Woche oder du bist noch keiner Trainingsgruppe zugewiesen."
            : "Alle Trainings in dieser Woche sind bereits vergangen."}
        >
          {!showPastSessions && sessions.length > 0 && (
            <Button
              variant="link"
              onClick={() => setShowPastSessions(true)}
              className="mt-2"
            >
              Vergangene anzeigen
            </Button>
          )}
        </EmptyState>
      ) : viewMode === 'list' ? (
        /* List View */
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="space-y-3">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    'p-3 sm:p-4 rounded-lg border',
                    session.isCancelled && 'bg-destructive/5 border-destructive/20',
                    session.athleteCancelled && 'bg-muted/50',
                    !session.isCancelled && !session.athleteCancelled && !session.isCompleted && 'bg-card',
                    isSessionPast(session) && 'opacity-60'
                  )}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(session)}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{session.groupName}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.trainingName} • {formatDate(session.date)} • {session.startTime} - {session.endTime}
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
                        {session.equipment && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Dumbbell className="h-3 w-3" />
                            <div className="flex flex-wrap gap-1">
                              {session.equipment.split(',').map((item, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs px-1.5 py-0">
                                  {item.trim()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {session.isCancelled && session.cancellationReason && (
                          <p className="text-xs text-destructive mt-1">
                            Grund: {session.cancellationReason}
                          </p>
                        )}
                        {session.athleteCancelled && session.athleteCancellationReason && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Deine Absage: {session.athleteCancellationReason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getAttendanceBadge(session)}
                      {session.isCancelled && (
                        <Badge variant="destructive">Training abgesagt</Badge>
                      )}
                      {session.athleteCancelled && !session.isCancelled && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">Du hast abgesagt</Badge>
                          {isWithinDeadline(session) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUndoSession(session);
                                setUndoDialogOpen(true);
                              }}
                              className="h-8 px-2"
                            >
                              Zurücknehmen
                            </Button>
                          )}
                        </div>
                      )}
                      {!session.isCancelled && !session.athleteCancelled && !session.isCompleted && (
                        renderSessionActions(session)
                      )}
                    </div>
                  </div>
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
            const dayIsPast = isPast(day);
            // Filter day sessions based on showPastSessions
            const filteredDaySessions = showPastSessions 
              ? daySessions 
              : daySessions.filter(() => !dayIsPast);
            
            return (
              <div key={day.toISOString()} className="min-h-[150px]">
                <div
                  className={cn(
                    'text-center p-2 rounded-t-lg',
                    isToday(day)
                      ? 'bg-primary text-primary-foreground'
                      : dayIsPast
                      ? 'bg-muted/50 text-muted-foreground'
                      : 'bg-muted'
                  )}
                >
                  <div className="text-xs">
                    {day.toLocaleDateString('de-DE', { weekday: 'short' })}
                  </div>
                  <div className="font-bold">{day.getDate()}</div>
                </div>
                <div className="border border-t-0 rounded-b-lg p-1 space-y-1 min-h-[100px]">
                  {filteredDaySessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        'text-xs p-1.5 rounded',
                        session.isCancelled && 'bg-destructive/20 text-destructive',
                        session.athleteCancelled && 'bg-muted text-muted-foreground',
                        !session.isCancelled && !session.athleteCancelled && 'bg-primary/10 text-primary'
                      )}
                    >
                      <div className="font-medium truncate">{session.groupName}</div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {session.startTime}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Undo Cancellation Dialog */}
      <ConfirmDialog
        open={undoDialogOpen}
        onOpenChange={setUndoDialogOpen}
        title="Absage zurücknehmen?"
        description="Möchtest du deine Absage für dieses Training zurücknehmen?"
        confirmText="Ja, zurücknehmen"
        cancelText="Abbrechen"
        onConfirm={() => undoSession && handleUndoCancellation(undoSession)}
        isLoading={isSubmitting}
      />
    </div>
  );
}