'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { PageHeader } from '@/components/shared';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Save,
  ArrowLeft,
  Calendar,
  Users,
  MessageSquare,
  Dumbbell,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';

interface AthleteAttendance {
  id: string;
  athleteId: string;
  name: string;
  group: string;
  status: 'PRESENT' | 'ABSENT_UNEXCUSED' | 'ABSENT_EXCUSED' | null;
  hasCancellation: boolean;
  cancellationNote?: string;
  note?: string;
}

interface SessionTrainer {
  id: string;
  name: string;
  cancelled: boolean;
  attendanceStatus: 'PRESENT' | 'ABSENT_UNEXCUSED' | 'ABSENT_EXCUSED' | null;
  attendanceNote?: string;
}

interface SessionDetail {
  id: string;
  date: string;
  name: string;
  startTime: string;
  endTime: string;
  groups: string[];
  isCancelled: boolean;
  equipment?: string | null;
  athletes: AthleteAttendance[];
  trainers?: SessionTrainer[];
}

import { useSession } from 'next-auth/react';

export default function SessionDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { data: authSession } = useSession();
  const isAdmin = authSession?.user?.activeRole === 'ADMIN';
  
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [attendanceData, setAttendanceData] = useState<Map<string, { status: string; note: string }>>(new Map());
  const [trainerAttendanceData, setTrainerAttendanceData] = useState<Map<string, { status: string; note: string }>>(new Map());
  const [equipment, setEquipment] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingTrainers, setIsSavingTrainers] = useState(false);
  const [isSavingEquipment, setIsSavingEquipment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [hasTrainerChanges, setHasTrainerChanges] = useState(false);

  useEffect(() => {
    fetch(`/api/trainer/sessions/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((result) => {
        setSession(result.data);
        // Initialize equipment
        setEquipment(result.data.equipment || '');
        // Initialize athlete attendance data from fetched data
        const initialData = new Map<string, { status: string; note: string }>();
        result.data.athletes.forEach((athlete: AthleteAttendance) => {
          initialData.set(athlete.athleteId, {
            status: athlete.status || '',
            note: athlete.note || '',
          });
        });
        setAttendanceData(initialData);
        
        // Initialize trainer attendance data
        const initialTrainerData = new Map<string, { status: string; note: string }>();
        result.data.trainers?.forEach((trainer: SessionTrainer) => {
          initialTrainerData.set(trainer.id, {
            status: trainer.attendanceStatus || '',
            note: trainer.attendanceNote || '',
          });
        });
        setTrainerAttendanceData(initialTrainerData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [id]);

  const updateAttendance = (athleteId: string, status: string) => {
    const newData = new Map(attendanceData);
    const current = newData.get(athleteId) || { status: '', note: '' };
    newData.set(athleteId, { ...current, status });
    setAttendanceData(newData);
    setHasChanges(true);
  };

  const updateNote = (athleteId: string, note: string) => {
    const newData = new Map(attendanceData);
    const current = newData.get(athleteId) || { status: '', note: '' };
    newData.set(athleteId, { ...current, note });
    setAttendanceData(newData);
    setHasChanges(true);
  };

  const markAllPresent = () => {
    const newData = new Map(attendanceData);
    session?.athletes.forEach((athlete) => {
      if (!athlete.hasCancellation) {
        const current = newData.get(athlete.athleteId) || { status: '', note: '' };
        newData.set(athlete.athleteId, { ...current, status: 'PRESENT' });
      }
    });
    setAttendanceData(newData);
    setHasChanges(true);
  };

  const saveAttendance = async () => {
    setIsSaving(true);
    try {
      const records = Array.from(attendanceData.entries())
        .filter(([, data]) => data.status)
        .map(([athleteId, data]) => ({
          athleteId,
          status: data.status,
          note: data.note || undefined,
        }));

      const res = await fetch(`/api/trainer/sessions/${id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });

      if (!res.ok) throw new Error('Failed to save');
      
      setHasChanges(false);
      router.refresh();
    } catch {
      setError('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  // Trainer attendance functions (admin only)
  const updateTrainerAttendance = (trainerId: string, status: string) => {
    const newData = new Map(trainerAttendanceData);
    const current = newData.get(trainerId) || { status: '', note: '' };
    newData.set(trainerId, { ...current, status });
    setTrainerAttendanceData(newData);
    setHasTrainerChanges(true);
  };

  const markAllTrainersPresent = () => {
    const newData = new Map(trainerAttendanceData);
    session?.trainers?.forEach((trainer) => {
      if (!trainer.cancelled) {
        const current = newData.get(trainer.id) || { status: '', note: '' };
        newData.set(trainer.id, { ...current, status: 'PRESENT' });
      }
    });
    setTrainerAttendanceData(newData);
    setHasTrainerChanges(true);
  };

  const saveTrainerAttendance = async () => {
    setIsSavingTrainers(true);
    try {
      const attendance = Array.from(trainerAttendanceData.entries())
        .filter(([, data]) => data.status)
        .map(([trainerId, data]) => ({
          trainerId,
          status: data.status,
          notes: data.note || undefined,
        }));

      const res = await fetch('/api/admin/trainer-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id, attendance }),
      });

      if (!res.ok) throw new Error('Failed to save');
      
      setHasTrainerChanges(false);
      router.refresh();
    } catch {
      setError('Fehler beim Speichern der Trainer-Anwesenheit');
    } finally {
      setIsSavingTrainers(false);
    }
  };

  const saveEquipment = async () => {
    setIsSavingEquipment(true);
    try {
      const res = await fetch(`/api/trainer/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipment }),
      });

      if (!res.ok) throw new Error('Failed to save');
      
      // Update session state with new equipment
      if (session) {
        setSession({ ...session, equipment });
      }
    } catch {
      setError('Fehler beim Speichern der Geräte');
    } finally {
      setIsSavingEquipment(false);
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <div className="text-destructive">Fehler beim Laden: {error}</div>;
  if (!session) return <div>Trainingseinheit nicht gefunden</div>;

  // Group athletes by their group
  const athletesByGroup = session.athletes.reduce((acc, athlete) => {
    if (!acc[athlete.group]) {
      acc[athlete.group] = [];
    }
    acc[athlete.group].push(athlete);
    return acc;
  }, {} as Record<string, AthleteAttendance[]>);

  const presentCount = Array.from(attendanceData.values()).filter(
    (d) => d.status === 'PRESENT'
  ).length;
  const absentCount = Array.from(attendanceData.values()).filter(
    (d) => d.status === 'ABSENT_UNEXCUSED' || d.status === 'ABSENT_EXCUSED'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/trainer/sessions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={session.name}
          description={`${formatDate(session.date)} · ${session.startTime} - ${session.endTime}`}
        />
      </div>

      {session.isCancelled && (
        <div className="bg-destructive/20 text-destructive p-4 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Diese Trainingseinheit wurde abgesagt</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Datum</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formatDate(session.date)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gruppen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {session.groups.map((group) => (
                <Badge key={group} variant="secondary">
                  {group}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Anwesend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {presentCount}/{session.athletes.length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Abwesend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{absentCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment / Geräte */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            Geräte
          </CardTitle>
          <CardDescription>Kommagetrennte Liste der Geräte für diese Trainingseinheit</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input
                placeholder="z.B. Boden, Reck, Barren, Schwebebalken"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={saveEquipment}
                disabled={isSavingEquipment || equipment === (session.equipment || '')}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSavingEquipment ? 'Speichern...' : 'Speichern'}
              </Button>
            </div>
            {session.equipment && (
              <div className="flex flex-wrap gap-2">
                {session.equipment.split(',').map((item, idx) => (
                  <Badge key={idx} variant="outline" className="bg-blue-50 dark:bg-blue-950">
                    {item.trim()}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trainers */}
      {session.trainers && session.trainers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trainer</CardTitle>
            {isAdmin && (
              <CardDescription>Als Admin können Sie die Trainer-Anwesenheit markieren</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {isAdmin ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button onClick={markAllTrainersPresent} variant="outline" size="sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Alle Trainer anwesend
                  </Button>
                  <Button
                    onClick={saveTrainerAttendance}
                    disabled={!hasTrainerChanges || isSavingTrainers}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSavingTrainers ? 'Speichern...' : 'Trainer speichern'}
                  </Button>
                </div>
                <div className="space-y-3">
                  {session.trainers.map((trainer) => {
                    const currentStatus = trainerAttendanceData.get(trainer.id)?.status || '';
                    return (
                      <div key={trainer.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <span className={trainer.cancelled ? 'line-through text-muted-foreground' : 'font-medium'}>
                            {trainer.name}
                          </span>
                          {trainer.cancelled && (
                            <Badge variant="outline" className="text-xs">Vorab abgesagt</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={currentStatus === 'PRESENT' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateTrainerAttendance(trainer.id, 'PRESENT')}
                            className={currentStatus === 'PRESENT' ? 'bg-green-600 hover:bg-green-700' : ''}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={currentStatus === 'ABSENT_EXCUSED' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateTrainerAttendance(trainer.id, 'ABSENT_EXCUSED')}
                            className={currentStatus === 'ABSENT_EXCUSED' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={currentStatus === 'ABSENT_UNEXCUSED' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateTrainerAttendance(trainer.id, 'ABSENT_UNEXCUSED')}
                            className={currentStatus === 'ABSENT_UNEXCUSED' ? 'bg-red-600 hover:bg-red-700' : ''}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {session.trainers.map((trainer) => (
                  <Badge 
                    key={trainer.id} 
                    variant={trainer.cancelled ? "outline" : "secondary"}
                    className={trainer.cancelled ? "line-through text-muted-foreground" : ""}
                  >
                    {trainer.name}
                    {trainer.cancelled && " (abgesagt)"}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!session.isCancelled && (
        <>
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={markAllPresent} variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Alle anwesend
            </Button>
            <Button
              onClick={saveAttendance}
              disabled={!hasChanges || isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Speichern...' : 'Speichern'}
            </Button>
          </div>

          {/* Attendance List */}
          <div className="space-y-6">
            {Object.entries(athletesByGroup).map(([groupName, athletes]) => (
              <Card key={groupName}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {groupName}
                  </CardTitle>
                  <CardDescription>{athletes.length} Athleten</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {athletes.map((athlete) => {
                      const currentData = attendanceData.get(athlete.athleteId) || { status: '', note: '' };
                      
                      return (
                        <div
                          key={athlete.athleteId}
                          className={`flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg border gap-3 ${
                            athlete.hasCancellation ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">{athlete.name}</p>
                              {athlete.hasCancellation && (
                                <div className="flex items-center gap-1 text-sm text-yellow-600 dark:text-yellow-400">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>Abgemeldet</span>
                                  {athlete.cancellationNote && (
                                    <span className="text-muted-foreground">
                                      : {athlete.cancellationNote}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant={currentData.status === 'PRESENT' ? 'default' : 'outline'}
                                className={currentData.status === 'PRESENT' ? 'bg-green-600 hover:bg-green-700' : ''}
                                onClick={() => updateAttendance(athlete.athleteId, 'PRESENT')}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={currentData.status === 'ABSENT_EXCUSED' ? 'default' : 'outline'}
                                className={currentData.status === 'ABSENT_EXCUSED' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                                onClick={() => updateAttendance(athlete.athleteId, 'ABSENT_EXCUSED')}
                                title="Entschuldigt abwesend"
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={currentData.status === 'ABSENT_UNEXCUSED' ? 'default' : 'outline'}
                                className={currentData.status === 'ABSENT_UNEXCUSED' ? 'bg-red-600 hover:bg-red-700' : ''}
                                onClick={() => updateAttendance(athlete.athleteId, 'ABSENT_UNEXCUSED')}
                                title="Unentschuldigt abwesend"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="relative">
                              <MessageSquare className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Notiz"
                                value={currentData.note}
                                onChange={(e) => updateNote(athlete.athleteId, e.target.value)}
                                className="pl-8 w-32 md:w-40"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Save Button (sticky at bottom for mobile) */}
          {hasChanges && (
            <div className="fixed bottom-4 left-4 right-4 md:static md:flex md:justify-end">
              <Button
                onClick={saveAttendance}
                disabled={isSaving}
                className="w-full md:w-auto"
                size="lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Speichern...' : 'Änderungen speichern'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
