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
  AlertTriangle,
  Save,
  ArrowLeft,
  Calendar,
  Users,
  MessageSquare,
  Timer,
  HelpCircle,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface AthleteAttendance {
  id: string;
  athleteId: string;
  name: string;
  group: string;
  groupId?: string;
  status: 'PRESENT' | 'ABSENT_UNEXCUSED' | 'ABSENT_EXCUSED' | null;
  isLate?: boolean;
  hasCancellation: boolean;
  cancellationNote?: string;
  note?: string;
  confirmed?: boolean | null;
  declineReason?: string | null;
  // Exception flags set by trainer
  noShow?: boolean; // Confirmed but didn't come
  showedUpUnannounced?: boolean; // Came without confirming
}

interface SessionTrainer {
  id: string;
  name: string;
  cancelled: boolean;
  attendanceStatus: 'PRESENT' | 'ABSENT_UNEXCUSED' | 'ABSENT_EXCUSED' | null;
  isLate?: boolean;
  attendanceNote?: string;
  confirmed?: boolean | null;
  declineReason?: string | null;
}

interface SessionDetail {
  id: string;
  date: string;
  name: string;
  startTime: string;
  endTime: string;
  groups: Array<string | { id: string; name: string }>;
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
  const [exceptionData, setExceptionData] = useState<Map<string, { noShow: boolean; showedUpUnannounced: boolean; isLate: boolean; note: string }>>(new Map());
  const [trainerExceptionData, setTrainerExceptionData] = useState<Map<string, { noShow: boolean; showedUpUnannounced: boolean; isLate: boolean; note: string }>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingTrainers, setIsSavingTrainers] = useState(false);
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
        // Initialize athlete exception data from fetched data
        const initialData = new Map<string, { noShow: boolean; showedUpUnannounced: boolean; isLate: boolean; note: string }>();
        result.data.athletes.forEach((athlete: AthleteAttendance) => {
          // Determine exception flags from attendance status
          const isNoShow = athlete.confirmed === true && athlete.status === 'ABSENT_UNEXCUSED';
          const showedUpUnannounced = athlete.confirmed === false && athlete.status === 'PRESENT';
          initialData.set(athlete.athleteId, {
            noShow: isNoShow,
            showedUpUnannounced: showedUpUnannounced,
            isLate: athlete.isLate || false,
            note: athlete.note || '',
          });
        });
        setExceptionData(initialData);
        
        // Initialize trainer exception data
        const initialTrainerData = new Map<string, { noShow: boolean; showedUpUnannounced: boolean; isLate: boolean; note: string }>();
        result.data.trainers?.forEach((trainer: SessionTrainer) => {
          const isNoShow = trainer.confirmed === true && trainer.attendanceStatus === 'ABSENT_UNEXCUSED';
          const showedUpUnannounced = trainer.confirmed === false && trainer.attendanceStatus === 'PRESENT';
          initialTrainerData.set(trainer.id, {
            noShow: isNoShow,
            showedUpUnannounced: showedUpUnannounced,
            isLate: trainer.isLate || false,
            note: trainer.attendanceNote || '',
          });
        });
        setTrainerExceptionData(initialTrainerData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [id]);

  // Exception update functions for athletes
  const updateAthleteException = (athleteId: string, field: 'noShow' | 'showedUpUnannounced' | 'isLate', value: boolean) => {
    const newData = new Map(exceptionData);
    const current = newData.get(athleteId) || { noShow: false, showedUpUnannounced: false, isLate: false, note: '' };
    newData.set(athleteId, { ...current, [field]: value });
    setExceptionData(newData);
    setHasChanges(true);
  };

  const updateAthleteNote = (athleteId: string, note: string) => {
    const newData = new Map(exceptionData);
    const current = newData.get(athleteId) || { noShow: false, showedUpUnannounced: false, isLate: false, note: '' };
    newData.set(athleteId, { ...current, note });
    setExceptionData(newData);
    setHasChanges(true);
  };

  const saveExceptions = async () => {
    setIsSaving(true);
    try {
      // Convert exceptions to attendance records
      const records = session?.athletes.map((athlete) => {
        const exception = exceptionData.get(athlete.athleteId) || { noShow: false, showedUpUnannounced: false, isLate: false, note: '' };
        
        // Determine status based on confirmation and exceptions
        let status: string;
        if (exception.noShow) {
          // Confirmed but didn't show - unexcused absent
          status = 'ABSENT_UNEXCUSED';
        } else if (exception.showedUpUnannounced) {
          // Didn't confirm but showed up - present
          status = 'PRESENT';
        } else if (athlete.confirmed === true) {
          // Confirmed and showed up (default behavior)
          status = 'PRESENT';
        } else if (athlete.confirmed === false) {
          // Declined - excused absent
          status = 'ABSENT_EXCUSED';
        } else {
          // No confirmation yet - skip
          return null;
        }

        return {
          athleteId: athlete.athleteId,
          status,
          note: exception.note || undefined,
          isLate: exception.isLate,
        };
      }).filter(Boolean);

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

  // Exception update functions for trainers (admin only)
  const updateTrainerException = (trainerId: string, field: 'noShow' | 'showedUpUnannounced' | 'isLate', value: boolean) => {
    const newData = new Map(trainerExceptionData);
    const current = newData.get(trainerId) || { noShow: false, showedUpUnannounced: false, isLate: false, note: '' };
    newData.set(trainerId, { ...current, [field]: value });
    setTrainerExceptionData(newData);
    setHasTrainerChanges(true);
  };

  const saveTrainerExceptions = async () => {
    setIsSavingTrainers(true);
    try {
      const attendance = session?.trainers?.map((trainer) => {
        const exception = trainerExceptionData.get(trainer.id) || { noShow: false, showedUpUnannounced: false, isLate: false, note: '' };
        
        // Determine status based on confirmation and exceptions
        let status: string;
        if (exception.noShow) {
          status = 'ABSENT_UNEXCUSED';
        } else if (exception.showedUpUnannounced) {
          status = 'PRESENT';
        } else if (trainer.confirmed === true) {
          status = 'PRESENT';
        } else if (trainer.confirmed === false) {
          status = 'ABSENT_EXCUSED';
        } else {
          return null;
        }

        return {
          trainerId: trainer.id,
          status,
          notes: exception.note || undefined,
          isLate: exception.isLate,
        };
      }).filter(Boolean);

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

  if (isLoading) return <Loading />;
  if (error) return <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">Fehler beim Laden: {error}</div>;
  if (!session) return <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">Trainingseinheit nicht gefunden</div>;

  // Group athletes by their group
  const athletesByGroup = session.athletes.reduce((acc, athlete) => {
    if (!acc[athlete.group]) {
      acc[athlete.group] = [];
    }
    acc[athlete.group].push(athlete);
    return acc;
  }, {} as Record<string, AthleteAttendance[]>);

  // Count confirmations
  const confirmedCount = session.athletes.filter(a => a.confirmed === true).length;
  const declinedCount = session.athletes.filter(a => a.confirmed === false).length;
  const pendingCount = session.athletes.filter(a => a.confirmed === null || a.confirmed === undefined).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/trainer/sessions">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={session.name}
          description={`${formatDate(session.date)} · ${session.startTime} - ${session.endTime}`}
        />
      </div>

      {session.isCancelled && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Diese Trainingseinheit wurde abgesagt</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Datum</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
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
                <Badge key={typeof group === 'string' ? group : group.id} variant="secondary">
                  {typeof group === 'string' ? group : group.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Zugesagt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <span className="text-2xl font-bold text-emerald-600">
                {confirmedCount}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Abgesagt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold text-red-600">{declinedCount}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ausstehend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold text-muted-foreground">{pendingCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trainers */}
      {session.trainers && session.trainers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trainer</CardTitle>
            {isAdmin && (
              <CardDescription>Als Admin können Sie Ausnahmen markieren</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {isAdmin ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    onClick={saveTrainerExceptions}
                    disabled={!hasTrainerChanges || isSavingTrainers}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSavingTrainers ? 'Speichern...' : 'Änderungen speichern'}
                  </Button>
                </div>
                <div className="space-y-3">
                  {session.trainers.map((trainer) => {
                    const exception = trainerExceptionData.get(trainer.id) || { noShow: false, showedUpUnannounced: false, isLate: false, note: '' };
                    
                    return (
                      <div key={trainer.id} className={`flex flex-col gap-3 p-3 rounded-lg border ${
                        trainer.confirmed === false ? 'bg-red-50 dark:bg-red-900/20' : 
                        trainer.confirmed === true ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-muted/30'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {/* Confirmation Status Icon */}
                            {trainer.confirmed === true ? (
                              <CheckCircle className="h-5 w-5 text-emerald-600" />
                            ) : trainer.confirmed === false ? (
                              <XCircle className="h-5 w-5 text-red-600" />
                            ) : (
                              <HelpCircle className="h-5 w-5 text-muted-foreground" />
                            )}
                            <span className={trainer.cancelled ? 'line-through text-muted-foreground' : 'font-medium'}>
                              {trainer.name}
                            </span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={
                              trainer.confirmed === true 
                                ? "text-emerald-600 border-emerald-300 bg-emerald-100 dark:bg-emerald-900/40" 
                                : trainer.confirmed === false 
                                  ? "text-red-600 border-red-300 bg-red-100 dark:bg-red-900/40"
                                  : "text-muted-foreground"
                            }
                          >
                            {trainer.confirmed === true ? 'Kommt' : trainer.confirmed === false ? 'Kommt nicht' : 'Ausstehend'}
                          </Badge>
                        </div>
                        
                        {/* Exception checkboxes */}
                        <div className="flex flex-wrap gap-4 text-sm">
                          {trainer.confirmed === true && (
                            <div className="flex items-center gap-1.5">
                              <Checkbox
                                id={`trainer-noshow-${trainer.id}`}
                                checked={exception.noShow}
                                onCheckedChange={(checked) => updateTrainerException(trainer.id, 'noShow', checked === true)}
                              />
                              <label htmlFor={`trainer-noshow-${trainer.id}`} className="text-muted-foreground cursor-pointer">
                                Nicht erschienen
                              </label>
                            </div>
                          )}
                          {trainer.confirmed === false && (
                            <div className="flex items-center gap-1.5">
                              <Checkbox
                                id={`trainer-showed-${trainer.id}`}
                                checked={exception.showedUpUnannounced}
                                onCheckedChange={(checked) => updateTrainerException(trainer.id, 'showedUpUnannounced', checked === true)}
                              />
                              <label htmlFor={`trainer-showed-${trainer.id}`} className="text-muted-foreground cursor-pointer">
                                Doch erschienen
                              </label>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Checkbox
                              id={`trainer-late-${trainer.id}`}
                              checked={exception.isLate}
                              onCheckedChange={(checked) => updateTrainerException(trainer.id, 'isLate', checked === true)}
                            />
                            <label htmlFor={`trainer-late-${trainer.id}`} className="text-muted-foreground flex items-center gap-1 cursor-pointer">
                              <Timer className="h-3 w-3" />
                              Verspätet
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {session.trainers.map((trainer) => (
                  <div key={trainer.id} className="flex items-center gap-2">
                    {trainer.confirmed === true ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    ) : trainer.confirmed === false ? (
                      <XCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={trainer.cancelled ? 'line-through text-muted-foreground' : ''}>
                      {trainer.name}
                    </span>
                  </div>
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
            <Button
              onClick={saveExceptions}
              disabled={!hasChanges || isSaving}
              className="h-10"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Speichern...' : 'Änderungen speichern'}
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
                  <div className="space-y-3">
                    {athletes.map((athlete) => {
                      const exception = exceptionData.get(athlete.athleteId) || { noShow: false, showedUpUnannounced: false, isLate: false, note: '' };
                      
                      return (
                        <div
                          key={athlete.athleteId}
                          className={`flex flex-col gap-3 p-3 rounded-lg border ${
                            athlete.confirmed === false ? 'bg-red-50 dark:bg-red-900/20' : 
                            athlete.confirmed === true ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {/* Confirmation Status Icon */}
                              {athlete.confirmed === true ? (
                                <CheckCircle className="h-5 w-5 text-emerald-600" />
                              ) : athlete.confirmed === false ? (
                                <XCircle className="h-5 w-5 text-red-600" />
                              ) : (
                                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                              )}
                              <p className="font-medium">{athlete.name}</p>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={
                                athlete.confirmed === true 
                                  ? "text-emerald-600 border-emerald-300 bg-emerald-100 dark:bg-emerald-900/40" 
                                  : athlete.confirmed === false 
                                    ? "text-red-600 border-red-300 bg-red-100 dark:bg-red-900/40"
                                    : "text-muted-foreground"
                              }
                            >
                              {athlete.confirmed === true ? 'Kommt' : athlete.confirmed === false ? 'Kommt nicht' : 'Ausstehend'}
                            </Badge>
                          </div>
                          
                          {/* Exception checkboxes */}
                          <div className="flex flex-wrap gap-4 text-sm">
                            {athlete.confirmed === true && (
                              <div className="flex items-center gap-1.5">
                                <Checkbox
                                  id={`noshow-${athlete.athleteId}`}
                                  checked={exception.noShow}
                                  onCheckedChange={(checked) => updateAthleteException(athlete.athleteId, 'noShow', checked === true)}
                                />
                                <label htmlFor={`noshow-${athlete.athleteId}`} className="text-muted-foreground cursor-pointer">
                                  Nicht erschienen
                                </label>
                              </div>
                            )}
                            {athlete.confirmed === false && (
                              <div className="flex items-center gap-1.5">
                                <Checkbox
                                  id={`showed-${athlete.athleteId}`}
                                  checked={exception.showedUpUnannounced}
                                  onCheckedChange={(checked) => updateAthleteException(athlete.athleteId, 'showedUpUnannounced', checked === true)}
                                />
                                <label htmlFor={`showed-${athlete.athleteId}`} className="text-muted-foreground cursor-pointer">
                                  Doch erschienen
                                </label>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <Checkbox
                                id={`late-${athlete.athleteId}`}
                                checked={exception.isLate}
                                onCheckedChange={(checked) => updateAthleteException(athlete.athleteId, 'isLate', checked === true)}
                              />
                              <label htmlFor={`late-${athlete.athleteId}`} className="text-muted-foreground flex items-center gap-1 cursor-pointer">
                                <Timer className="h-3 w-3" />
                                Verspätet
                              </label>
                            </div>
                            <div className="relative flex-1 min-w-[120px]">
                              <MessageSquare className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Notiz"
                                value={exception.note}
                                onChange={(e) => updateAthleteNote(athlete.athleteId, e.target.value)}
                                className="pl-8 h-8"
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
            <div className="fixed bottom-4 left-4 right-4 sm:static sm:flex sm:justify-end">
              <Button
                onClick={saveExceptions}
                disabled={isSaving}
                className="w-full sm:w-auto h-12"
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
