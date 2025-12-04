'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Calendar, 
  List, 
  CheckCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Users,
  Undo2,
  XCircle,
  Dumbbell,
  Check,
  Edit,
} from 'lucide-react';
import Link from 'next/link';

interface SessionTrainer {
  id: string;
  name: string;
  cancelled: boolean;
  confirmed?: boolean;
}

interface TrainingSession {
  id: string;
  date: string;
  name: string;
  startTime: string;
  endTime: string;
  groups: string[];
  attendanceMarked: boolean;
  isCancelled: boolean;
  expectedAthletes: number;
  presentCount: number;
  equipment?: string | null;
  trainers?: SessionTrainer[];
  trainerCancelled?: boolean;
  trainerCancellationId?: string;
  confirmedAthletes?: number;
  declinedAthletes?: number;
}

export default function TrainerSessionsPage() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const getWeekStart = useCallback((offset: number) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff + offset * 7);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, []);

  const fetchSessions = useCallback(() => {
    setIsLoading(true);
    const startDate = getWeekStart(currentWeekOffset);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    fetch(`/api/trainer/sessions?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((result) => setSessions(result.data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [currentWeekOffset, getWeekStart]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

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

  if (error) return <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">Fehler beim Laden: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold sm:text-2xl">Trainingseinheiten</h1>
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
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as 'list' | 'calendar')}>
        <TabsList>
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-2" />
            Liste
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Kalender
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {isLoading ? (
            <Loading />
          ) : sessions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Keine Trainingseinheiten in dieser Woche</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <SessionCard key={session.id} session={session} onRefresh={fetchSessions} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          {isLoading ? (
            <Loading />
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {getWeekDays().map((day) => (
                <div key={day.toISOString()} className="min-h-[150px]">
                  <div
                    className={`text-center p-2 rounded-t-lg ${
                      isToday(day)
                        ? 'bg-primary text-primary-foreground'
                        : isPast(day)
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-xs">
                      {day.toLocaleDateString('de-DE', { weekday: 'short' })}
                    </div>
                    <div className="font-bold">{day.getDate()}</div>
                  </div>
                  <div className="border border-t-0 rounded-b-lg p-1 space-y-1 min-h-[100px]">
                    {getSessionsForDate(day).map((session) => (
                      <Link
                        key={session.id}
                        href={`/trainer/sessions/${session.id}`}
                        className="block"
                      >
                        <div
                          className={`p-2 rounded text-xs hover:opacity-80 transition-opacity ${
                            session.isCancelled
                              ? 'bg-destructive/20 text-destructive'
                              : session.attendanceMarked
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                          }`}
                        >
                          <div className="font-medium truncate">{session.name}</div>
                          <div>{session.startTime}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SessionCard({ session, onRefresh }: { session: TrainingSession; onRefresh: () => void }) {
  const sessionDate = new Date(session.date);
  const isPast = sessionDate < new Date();
  const [isUndoing, setIsUndoing] = useState(false);
  const [isCancellingSession, setIsCancellingSession] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isEditingEquipment, setIsEditingEquipment] = useState(false);
  const [equipmentValue, setEquipmentValue] = useState(session.equipment || '');
  const [isSavingEquipment, setIsSavingEquipment] = useState(false);
  const { data: authSession } = useSession();
  const isAdmin = authSession?.user?.activeRole === 'ADMIN';
  const currentTrainerId = authSession?.user?.trainerProfileId;
  
  // Find current trainer's confirmation status
  const currentTrainer = session.trainers?.find(t => t.id === currentTrainerId);
  const isTrainerConfirmed = currentTrainer?.confirmed ?? false;

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
      onRefresh();
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
      const res = await fetch(`/api/trainer/sessions/${session.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fehler beim Absagen');
      }
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Fehler beim Absagen des Trainings');
    } finally {
      setIsCancellingSession(false);
    }
  };

  const handleUncancelSession = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsCancellingSession(true);
    try {
      const res = await fetch(`/api/trainer/sessions/${session.id}/cancel`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Fehler beim Zurücknehmen');
      }
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Fehler beim Zurücknehmen der Absage');
    } finally {
      setIsCancellingSession(false);
    }
  };

  const handleSaveEquipment = async () => {
    setIsSavingEquipment(true);
    try {
      const res = await fetch(`/api/trainer/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipment: equipmentValue }),
      });
      if (!res.ok) {
        throw new Error('Fehler beim Speichern');
      }
      setIsEditingEquipment(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Fehler beim Speichern der Geräte');
    } finally {
      setIsSavingEquipment(false);
    }
  };

  // Get confirmed trainers
  const confirmedTrainers = session.trainers?.filter(t => t.confirmed && !t.cancelled) || [];

  return (
    <Link href={`/trainer/sessions/${session.id}`}>
      <Card
        className={`hover:border-primary transition-colors ${
          session.isCancelled || session.trainerCancelled ? 'opacity-60' : ''
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center w-14 h-14 bg-muted rounded-lg">
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
                  <h3 className="font-semibold">{session.name}</h3>
                  {session.isCancelled && (
                    <Badge variant="destructive">Abgesagt</Badge>
                  )}
                  {session.trainerCancelled && !session.isCancelled && (
                    <Badge variant="secondary">Abgemeldet</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {session.startTime} - {session.endTime}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {session.groups.map((group) => (
                    <Badge key={group} variant="secondary" className="text-xs">
                      {group}
                    </Badge>
                  ))}
                </div>
                {session.trainers && session.trainers.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Users className="h-3 w-3" />
                    <span>
                      {session.trainers.map((t, idx) => (
                        <span key={t.id}>
                          <span className={t.cancelled ? 'line-through text-muted-foreground' : t.confirmed ? 'text-emerald-600' : ''}>
                            {t.name}
                            {t.confirmed && !t.cancelled && <Check className="h-3 w-3 inline ml-0.5 text-emerald-600" />}
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
                    {!isPast && (
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
                {!session.equipment && !isPast && (
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
                  {isAdmin && !isPast && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelSession}
                      disabled={isCancellingSession}
                      className="text-destructive hover:text-destructive"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      {isCancellingSession ? '...' : 'Training absagen'}
                    </Button>
                  )}
                  {/* Trainer confirmation buttons */}
                  {!isAdmin && !isPast && !session.trainerCancelled && (
                    <div className="flex gap-1">
                      <Button
                        variant={isTrainerConfirmed ? "default" : "outline"}
                        size="sm"
                        onClick={(e) => handleConfirmTrainer(e, true)}
                        disabled={isConfirming || isTrainerConfirmed}
                        className={isTrainerConfirmed ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={!isTrainerConfirmed && currentTrainer ? "destructive" : "outline"}
                        size="sm"
                        onClick={(e) => handleConfirmTrainer(e, false)}
                        disabled={isConfirming}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {session.trainerCancelled && !isPast && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUndoCancellation}
                      disabled={isUndoing}
                    >
                      <Undo2 className="h-4 w-4 mr-1" />
                      {isUndoing ? 'Wird zurückgenommen...' : 'Zurücknehmen'}
                    </Button>
                  )}
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">
                        {session.attendanceMarked
                          ? `${session.presentCount}/${session.expectedAthletes}`
                          : session.confirmedAthletes !== undefined
                            ? `${session.confirmedAthletes}/${session.expectedAthletes} bestätigt`
                            : session.expectedAthletes}
                      </span>
                    </div>
                    {confirmedTrainers.length > 0 && (
                      <span className="text-xs text-emerald-600">
                        {confirmedTrainers.length} Trainer bestätigt
                      </span>
                    )}
                  </div>
                  {isPast ? (
                    session.attendanceMarked ? (
                      <CheckCircle className="h-6 w-6 text-emerald-500" />
                    ) : (
                      <Badge variant="destructive">
                        <Clock className="h-3 w-3 mr-1" />
                        Anwesenheit fehlt
                      </Badge>
                    )
                  ) : (
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  )}
                </>
              )}
              {session.isCancelled && isAdmin && !isPast && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUncancelSession}
                  disabled={isCancellingSession}
                >
                  <Undo2 className="h-4 w-4 mr-1" />
                  Absage zurücknehmen
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Edit Dialog */}
      <Dialog open={isEditingEquipment} onOpenChange={setIsEditingEquipment}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Geräte bearbeiten</DialogTitle>
            <DialogDescription>
              Geben Sie die Geräte für diese Trainingseinheit ein (kommagetrennt).
              Diese werden als Labels für die Gruppen angezeigt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="equipment">Geräte (kommagetrennt)</Label>
              <Input
                id="equipment"
                placeholder="z.B. Reck, Barren, Boden, Sprung"
                value={equipmentValue}
                onChange={(e) => setEquipmentValue(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Beispiel: Reck, Barren, Boden, Sprung, Balken
              </p>
            </div>
            {equipmentValue && (
              <div className="space-y-2">
                <Label>Vorschau</Label>
                <div className="flex flex-wrap gap-1">
                  {equipmentValue.split(',').map((item, idx) => (
                    <Badge key={idx} variant="secondary">
                      {item.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditingEquipment(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveEquipment} disabled={isSavingEquipment}>
              {isSavingEquipment ? 'Speichern...' : 'Speichern'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Link>
  );
}
