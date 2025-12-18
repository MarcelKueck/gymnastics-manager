'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loading } from '@/components/ui/loading';
import { PageHeader } from '@/components/shared/page-header';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  List,
  XCircle,
  Undo2,
  Check,
  Clock,
  Dumbbell,
  Edit,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface GroupSession {
  id: string;
  recurringTrainingId: string;
  groupId: string;
  groupName: string;
  trainingName: string;
  date: string;
  startTime: string;
  endTime: string;
  isCancelled: boolean;
  isCompleted: boolean;
  attendanceMarked: boolean;
  expectedAthletes: number;
  confirmedAthletes: number;
  declinedAthletes: number;
  presentCount: number;
  isOwnGroup: boolean;
  trainerCancelled: boolean;
  trainerCancellationId?: string;
  trainerCancellationReason?: string;
  trainerConfirmed: boolean;
  equipment: string | null;
  trainers?: Array<{
    id: string;
    name: string;
    cancelled: boolean;
    confirmed: boolean;
  }>;
}

function getWeekStart(offset: number): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const start = new Date(now.setDate(diff));
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + offset * 7);
  return start;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate < today;
}

export default function TrainerSessionsPage() {
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [confirmationMode, setConfirmationMode] = useState<'AUTO_CONFIRM' | 'REQUIRE_CONFIRMATION'>('AUTO_CONFIRM');
  const [cancellationDeadlineHours, setCancellationDeadlineHours] = useState(2);
  const [showPastSessions, setShowPastSessions] = useState(false);
  const { data: authSession } = useSession();
  const isAdmin = authSession?.user?.activeRole === 'ADMIN';

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    const weekStart = getWeekStart(currentWeekOffset);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    try {
      const res = await fetch(
        `/api/trainer/sessions?from=${weekStart.toISOString()}&to=${weekEnd.toISOString()}`
      );
      if (res.ok) {
        const result = await res.json();
        setSessions(result.data || []);
        if (result.confirmationMode) {
          setConfirmationMode(result.confirmationMode);
        }
        if (result.cancellationDeadlineHours !== undefined) {
          setCancellationDeadlineHours(result.cancellationDeadlineHours);
        }
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentWeekOffset]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const formatWeekRange = () => {
    const start = getWeekStart(currentWeekOffset);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}`;
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

  // Filter sessions based on showPastSessions toggle
  const filteredSessions = sessions.filter((session) => {
    if (showPastSessions) return true;
    const sessionDate = new Date(session.date);
    return !isPast(sessionDate);
  });

  // Check if there are any past sessions to show the toggle
  const hasPastSessions = sessions.some((session) => {
    const sessionDate = new Date(session.date);
    return isPast(sessionDate);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trainingseinheiten"
        description="Verwalte und bearbeite deine Trainingseinheiten"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
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
            className="h-10 w-10"
            onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
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

      <Tabs value={view} onValueChange={(v) => setView(v as 'list' | 'calendar')}>
        <TabsList>
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-2" />
            Liste
          </TabsTrigger>
          <TabsTrigger value="calendar" className="hidden sm:flex">
            <Calendar className="h-4 w-4 mr-2" />
            Kalender
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {isLoading ? (
            <Loading />
          ) : filteredSessions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {sessions.length === 0 
                    ? 'Keine Trainingseinheiten in dieser Woche'
                    : 'Keine anstehenden Trainingseinheiten in dieser Woche'}
                </p>
                {!showPastSessions && sessions.length > 0 && (
                  <Button
                    variant="link"
                    onClick={() => setShowPastSessions(true)}
                    className="mt-2"
                  >
                    Vergangene anzeigen
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => (
                <GroupSessionCard 
                  key={session.id} 
                  session={session} 
                  onRefresh={fetchSessions} 
                  confirmationMode={confirmationMode}
                  cancellationDeadlineHours={cancellationDeadlineHours}
                  onSessionUpdate={(updatedSession) => {
                    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          {isLoading ? (
            <Loading />
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {getWeekDays().map((day) => {
                const daySessions = getSessionsForDate(day);
                // Filter day sessions based on showPastSessions
                const filteredDaySessions = showPastSessions 
                  ? daySessions 
                  : daySessions.filter(() => !isPast(day));
                
                return (
                  <div key={day.toISOString()} className="min-h-[150px]">
                    <div
                      className={`text-center p-2 rounded-t-lg ${
                        isToday(day)
                          ? 'bg-primary text-primary-foreground'
                          : isPast(day)
                          ? 'bg-muted/50 text-muted-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="text-xs">
                        {day.toLocaleDateString('de-DE', { weekday: 'short' })}
                      </div>
                      <div className="font-bold">{day.getDate()}</div>
                    </div>
                    <div className="border border-t-0 rounded-b-lg p-1 space-y-1 min-h-[100px]">
                      {filteredDaySessions.map((session) => (
                        <Link
                          key={session.id}
                          href={`/trainer/sessions/${session.id}`}
                        >
                          <div
                            className={`text-xs p-1.5 rounded cursor-pointer hover:opacity-80 ${
                              session.isCancelled
                                ? 'bg-destructive/20 text-destructive'
                                : session.attendanceMarked
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                            }`}
                          >
                            <div className="font-medium truncate">{session.groupName}</div>
                            <div className="text-[10px] opacity-70">{session.trainingName}</div>
                            <div>{session.startTime}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GroupSessionCard({ 
  session, 
  onRefresh, 
  confirmationMode,
  cancellationDeadlineHours,
  onSessionUpdate 
}: { 
  session: GroupSession; 
  onRefresh: () => void;
  confirmationMode: 'AUTO_CONFIRM' | 'REQUIRE_CONFIRMATION';
  cancellationDeadlineHours: number;
  onSessionUpdate: (session: GroupSession) => void;
}) {
  const sessionDate = new Date(session.date);
  const sessionIsPast = isPast(sessionDate);
  const [isUndoing, setIsUndoing] = useState(false);
  const [isCancellingSession, setIsCancellingSession] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isEditingEquipment, setIsEditingEquipment] = useState(false);
  const [equipmentValue, setEquipmentValue] = useState(session.equipment || '');
  const [isSavingEquipment, setIsSavingEquipment] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancellingTrainer, setIsCancellingTrainer] = useState(false);
  const { data: authSession } = useSession();
  const isAdmin = authSession?.user?.activeRole === 'ADMIN';
  const currentTrainerId = authSession?.user?.trainerProfileId;
  
  // Find current trainer in this group's trainers
  const currentTrainer = session.trainers?.find(t => t.id === currentTrainerId);
  const isTrainerInGroup = !!currentTrainer;
  
  // BUG FIX #1: In AUTO_CONFIRM mode, trainer is considered confirmed unless explicitly declined
  const isTrainerConfirmed = confirmationMode === 'AUTO_CONFIRM'
    ? currentTrainer?.confirmed !== false
    : currentTrainer?.confirmed === true;

  // Check if session is within deadline for confirmation changes
  const isWithinDeadline = (() => {
    const sessionDateTime = new Date(session.date);
    const [hours, minutes] = session.startTime.split(':').map(Number);
    sessionDateTime.setHours(hours, minutes, 0, 0);
    
    const deadlineTime = new Date(sessionDateTime);
    deadlineTime.setHours(deadlineTime.getHours() - cancellationDeadlineHours);
    
    return new Date() <= deadlineTime;
  })();
  
  // Check if session has already started
  const hasSessionStarted = (() => {
    const sessionDateTime = new Date(session.date);
    const [hours, minutes] = session.startTime.split(':').map(Number);
    sessionDateTime.setHours(hours, minutes, 0, 0);
    return new Date() > sessionDateTime;
  })();

  // Determine if trainer can cancel (for this group)
  // BUG FIX #4: Trainers can always cancel before session starts (with late flag if after deadline)
  const canEdit = isAdmin || session.isOwnGroup;

  const handleConfirmTrainer = async (e: React.MouseEvent, confirmed: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsConfirming(true);
    try {
      const res = await fetch('/api/session-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          confirmed,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Bestätigen');
      }
      
      // Update local session state with new trainer confirmation
      const updatedTrainers = session.trainers?.map(t => 
        t.id === currentTrainerId ? { ...t, confirmed } : t
      ) || [];
      
      onSessionUpdate({
        ...session,
        trainers: updatedTrainers,
        trainerConfirmed: confirmed,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleUndoCancellation = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session.trainerCancellationId) return;
    setIsUndoing(true);
    try {
      const res = await fetch(`/api/trainer/cancellations/${session.trainerCancellationId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Fehler beim Zurücknehmen');
      }
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUndoing(false);
    }
  };

  const handleCancelSession = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const reason = prompt('Grund für die Absage (wird an alle Teilnehmer gesendet):');
    if (!reason) return;
    
    setIsCancellingSession(true);
    try {
      const res = await fetch(`/api/admin/sessions/${session.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        throw new Error('Fehler beim Absagen');
      }
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCancellingSession(false);
    }
  };

  // BUG FIX #4: Handler for trainer cancellation with reason
  const handleTrainerCancel = async () => {
    if (!cancelReason || cancelReason.length < 10) {
      alert('Bitte gib einen Grund an (mindestens 10 Zeichen)');
      return;
    }
    
    setIsCancellingTrainer(true);
    try {
      const res = await fetch('/api/trainer/cancellations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          reason: cancelReason,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Absagen');
      }
      
      // Show warning if late
      if (data.isLate) {
        alert(data.message);
      }
      
      setShowCancelDialog(false);
      setCancelReason('');
      onRefresh();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Fehler beim Absagen');
    } finally {
      setIsCancellingTrainer(false);
    }
  };

  const handleSaveEquipment = async () => {
    setIsSavingEquipment(true);
    try {
      const res = await fetch(`/api/trainer/sessions/${session.id}/equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipment: equipmentValue }),
      });
      if (!res.ok) throw new Error('Failed to save');
      
      onSessionUpdate({
        ...session,
        equipment: equipmentValue || null,
      });
      setIsEditingEquipment(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingEquipment(false);
    }
  };

  return (
    <>
      <Link href={`/trainer/sessions/${session.id}`}>
        <Card
          className={`hover:bg-muted/50 transition-colors cursor-pointer ${
            session.isCancelled ? 'opacity-60' : sessionIsPast ? 'opacity-60' : ''
          } ${session.isOwnGroup ? 'border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg ${session.isOwnGroup ? 'bg-primary/10' : 'bg-muted'}`}>
                  <span className="text-xs text-muted-foreground">
                    {sessionDate.toLocaleDateString('de-DE', { weekday: 'short' })}
                  </span>
                  <span className="text-lg font-bold">{sessionDate.getDate()}</span>
                  <span className="text-xs text-muted-foreground">
                    {sessionDate.toLocaleDateString('de-DE', { month: 'short' })}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{session.groupName}</h3>
                    {session.isOwnGroup && !isAdmin && (
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">Meine Gruppe</Badge>
                    )}
                    {session.isCancelled && (
                      <Badge variant="destructive">Abgesagt</Badge>
                    )}
                    {session.trainerCancelled && !session.isCancelled && (
                      <Badge variant="secondary">Abgemeldet</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {session.trainingName} • {session.startTime} - {session.endTime}
                  </p>
                  {session.trainers && session.trainers.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Users className="h-3 w-3" />
                      <span>
                        {session.trainers.map((t, idx) => {
                          // BUG FIX #1: In AUTO_CONFIRM mode, trainer is confirmed unless explicitly declined
                          const isEffectivelyConfirmed = confirmationMode === 'AUTO_CONFIRM'
                            ? t.confirmed !== false
                            : t.confirmed === true;
                          
                          return (
                            <span key={t.id}>
                              <span className={t.cancelled ? 'line-through text-muted-foreground' : isEffectivelyConfirmed ? 'text-emerald-600' : ''}>
                                {t.name}
                                {isEffectivelyConfirmed && !t.cancelled && <Check className="h-3 w-3 inline ml-0.5 text-emerald-600" />}
                              </span>
                              {idx < (session.trainers?.length ?? 0) - 1 && ', '}
                            </span>
                          );
                        })}
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
                      {!sessionIsPast && canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1 ml-1"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEquipmentValue(session.equipment || '');
                            setIsEditingEquipment(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                  {!session.equipment && !sessionIsPast && canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground h-5 px-1 mt-1"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEquipmentValue('');
                        setIsEditingEquipment(true);
                      }}
                    >
                      <Dumbbell className="h-3 w-3 mr-1" />
                      Geräte hinzufügen
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {!session.isCancelled && (
                  <>
                    {/* Admin cancel entire session button */}
                    {isAdmin && !sessionIsPast && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelSession}
                        disabled={isCancellingSession}
                        className="text-destructive hover:text-destructive"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        {isCancellingSession ? '...' : 'Absagen'}
                      </Button>
                    )}
                    {/* Trainer confirmation/cancel buttons (only if trainer is assigned to this group) */}
                    {isTrainerInGroup && !isAdmin && !sessionIsPast && !session.trainerCancelled && !hasSessionStarted && (
                      <div className="flex gap-1">
                        {/* Show confirm button only within deadline */}
                        {isWithinDeadline && (
                          <>
                            <Button
                              variant={isTrainerConfirmed ? "default" : "outline"}
                              size="sm"
                              onClick={(e) => handleConfirmTrainer(e, true)}
                              disabled={isConfirming || isTrainerConfirmed}
                              className={isTrainerConfirmed ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {/* BUG FIX #4: Always show cancel button (will be marked as late if after deadline) */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowCancelDialog(true);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {/* Show deadline passed indicator but still allow cancellation */}
                    {isTrainerInGroup && !isAdmin && !sessionIsPast && !session.trainerCancelled && !isWithinDeadline && !hasSessionStarted && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                          <Clock className="h-3 w-3 mr-1" />
                          Frist abgelaufen
                        </Badge>
                        {/* BUG FIX #4: Still allow cancel after deadline */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowCancelDialog(true);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {session.trainerCancelled && !sessionIsPast && !hasSessionStarted && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleUndoCancellation}
                        disabled={isUndoing}
                      >
                        <Undo2 className="h-4 w-4 mr-1" />
                        {isUndoing ? '...' : 'Zurück'}
                      </Button>
                    )}
                    <div className="flex flex-col items-end gap-0.5">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span className="text-sm">
                          {session.attendanceMarked
                            ? `${session.presentCount}/${session.expectedAthletes}`
                            : confirmationMode === 'AUTO_CONFIRM'
                              ? `${session.expectedAthletes - session.declinedAthletes}/${session.expectedAthletes}`
                              : `${session.confirmedAthletes}/${session.expectedAthletes}`}
                        </span>
                      </div>
                      {/* BUG FIX #3: Removed the red "Anwesenheit" label entirely */}
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
      
      {/* Equipment Edit Dialog */}
      <Dialog open={isEditingEquipment} onOpenChange={setIsEditingEquipment}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Geräte bearbeiten</DialogTitle>
            <DialogDescription>
              Gib die benötigten Geräte für dieses Training ein (kommagetrennt)
            </DialogDescription>
          </DialogHeader>
          <Input
            value={equipmentValue}
            onChange={(e) => setEquipmentValue(e.target.value)}
            placeholder="z.B. Matten, Bälle, Reifen"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingEquipment(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveEquipment} disabled={isSavingEquipment}>
              {isSavingEquipment ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* BUG FIX #4: Trainer Cancel Dialog with reason */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Training absagen</DialogTitle>
            <DialogDescription>
              {!isWithinDeadline && (
                <span className="text-orange-600 block mb-2">
                  Hinweis: Die Absagefrist ist bereits abgelaufen. Diese Absage wird als unentschuldigt gewertet.
                </span>
              )}
              Bitte gib einen Grund für deine Absage an (mindestens 10 Zeichen).
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Grund für die Absage..."
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Abbrechen
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleTrainerCancel} 
              disabled={isCancellingTrainer || cancelReason.length < 10}
            >
              {isCancellingTrainer ? 'Absagen...' : 'Absagen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}