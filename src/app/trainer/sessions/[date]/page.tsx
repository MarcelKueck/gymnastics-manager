'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Check, X, AlertCircle, Users, Eye, GripVertical, ArrowRightLeft } from 'lucide-react';
import { format, isPast, subWeeks } from 'date-fns';
import { de } from 'date-fns/locale';

interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  isTemporarilyReassigned?: boolean;
  reassignmentReason?: string | null;
}

interface Trainer {
  id: string;
  firstName: string;
  lastName: string;
}

interface SessionGroup {
  id: string;
  exercises: string | null;
  notes: string | null;
  trainingGroup: {
    id: string;
    name: string;
    description: string | null;
  };
  athletes: Athlete[];
  trainerAssignments: {
    trainer: Trainer | null;
  }[];
}

interface TrainingSession {
  id: string;
  date: string;
  dayOfWeek: string;
  startTime: string | null;
  endTime: string | null;
  isCancelled: boolean;
  cancellationReason: string | null;
  groups: SessionGroup[];
  recurringTraining: {
    name: string;
  } | null;
  attendanceRecords: {
    id: string;
    athleteId: string;
    status: 'PRESENT' | 'ABSENT_UNEXCUSED' | 'ABSENT_EXCUSED';
  }[];
}

interface Cancellation {
  id: string;
  athleteId: string;
  reason: string;
  cancelledAt: string;
  athlete: {
    firstName: string;
    lastName: string;
  };
}

interface GroupExercises {
  [sessionGroupId: string]: string;
}

interface GroupNotes {
  [sessionGroupId: string]: string;
}

interface Attendance {
  [sessionId: string]: {
    [athleteId: string]: string;
  };
}

interface ReassignmentModal {
  isOpen: boolean;
  athlete: Athlete | null;
  fromGroupId: string | null;
  toGroupId: string | null;
  fromGroupName: string;
  toGroupName: string;
}

export default function TrainerSessionPage() {
  const params = useParams();
  const router = useRouter();
  const date = params.date as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [cancellations, setCancellations] = useState<Cancellation[]>([]);
  const [allTrainers, setAllTrainers] = useState<Trainer[]>([]);
  
  const [groupExercises, setGroupExercises] = useState<GroupExercises>({});
  const [groupNotes, setGroupNotes] = useState<GroupNotes>({});
  const [attendance, setAttendance] = useState<Attendance>({});
  
  const [draggedAthlete, setDraggedAthlete] = useState<{ athlete: Athlete; fromGroupId: string } | null>(null);
  const [reassignmentModal, setReassignmentModal] = useState<ReassignmentModal>({
    isOpen: false,
    athlete: null,
    fromGroupId: null,
    toGroupId: null,
    fromGroupName: '',
    toGroupName: '',
  });
  const [reassignmentReason, setReassignmentReason] = useState('');

  useEffect(() => {
    if (date) {
      fetchSessionData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/trainer/sessions/${date}`);
      if (!response.ok) throw new Error('Failed to fetch session data');
      
      const data = await response.json();
      
      setSessions(data.sessions || []);
      setCancellations(data.cancellations || []);
      setAllTrainers(data.trainers || []);

      // Initialize exercises and notes
      const exercises: GroupExercises = {};
      const notes: GroupNotes = {};
      const attendanceState: Attendance = {};

      data.sessions?.forEach((session: TrainingSession) => {
        attendanceState[session.id] = {};
        
        session.groups?.forEach((group: SessionGroup) => {
          exercises[group.id] = group.exercises || '';
          notes[group.id] = group.notes || '';
          
          // Initialize attendance for athletes in this group
          group.athletes.forEach((athlete: Athlete) => {
            const existing = session.attendanceRecords?.find(
              (record) => record.athleteId === athlete.id
            );
            attendanceState[session.id][athlete.id] = existing?.status || 'PRESENT';
          });
        });
      });

      setGroupExercises(exercises);
      setGroupNotes(notes);
      setAttendance(attendanceState);
    } catch (err) {
      console.error('Error fetching session:', err);
      setError('Fehler beim Laden der Session-Daten');
    } finally {
      setLoading(false);
    }
  };

  const fetchPreviousWeekExercises = async () => {
    try {
      setLoadingPrevious(true);
      const previousDate = format(subWeeks(new Date(date), 1), 'yyyy-MM-dd');
      
      const response = await fetch(`/api/trainer/sessions/previous-exercises?date=${previousDate}`);
      if (!response.ok) throw new Error('Failed to fetch previous exercises');
      
      const data = await response.json();
      
      // Map previous exercises by training group ID
      const exercises: GroupExercises = { ...groupExercises };
      
      sessions.forEach((session) => {
        session.groups.forEach((group) => {
          const previousGroup = data.sessionGroups?.find(
            (pg: any) => pg.trainingGroupId === group.trainingGroup.id
          );
          if (previousGroup?.exercises) {
            exercises[group.id] = previousGroup.exercises;
          }
        });
      });
      
      setGroupExercises(exercises);
      setSuccess('Übungen der letzten Woche geladen!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error fetching previous exercises:', err);
      setError('Keine Übungen der letzten Woche gefunden');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoadingPrevious(false);
    }
  };

  const handleAttendanceChange = (sessionId: string, athleteId: string, status: string) => {
    setAttendance((prev) => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        [athleteId]: status,
      },
    }));
  };

  const handleMarkAllPresent = (sessionId: string, groupId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    const group = session?.groups.find((g) => g.id === groupId);
    if (!group) return;

    setAttendance((prev) => {
      const newAttendance = { ...prev };
      group.athletes.forEach((athlete) => {
        newAttendance[sessionId][athlete.id] = 'PRESENT';
      });
      return newAttendance;
    });
  };

  const handleDragStart = (athlete: Athlete, fromGroupId: string) => {
    setDraggedAthlete({ athlete, fromGroupId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (sessionId: string, toGroupId: string) => {
    if (!draggedAthlete) return;
    
    const { athlete, fromGroupId } = draggedAthlete;
    
    if (fromGroupId === toGroupId) {
      setDraggedAthlete(null);
      return;
    }

    // Find group names for modal
    const session = sessions.find((s) => s.id === sessionId);
    const fromGroup = session?.groups.find((g) => g.id === fromGroupId);
    const toGroup = session?.groups.find((g) => g.id === toGroupId);
    
    if (!fromGroup || !toGroup) {
      setDraggedAthlete(null);
      return;
    }

    setReassignmentModal({
      isOpen: true,
      athlete,
      fromGroupId,
      toGroupId,
      fromGroupName: fromGroup.trainingGroup.name,
      toGroupName: toGroup.trainingGroup.name,
    });
  };

  const confirmReassignment = async () => {
    if (!reassignmentModal.athlete || !reassignmentModal.toGroupId) return;

    try {
      const response = await fetch(`/api/trainer/sessions/${date}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionGroupId: reassignmentModal.toGroupId,
          athleteId: reassignmentModal.athlete.id,
          reason: reassignmentReason || 'Keine Angabe',
        }),
      });

      if (!response.ok) throw new Error('Failed to reassign athlete');

      setSuccess(`${reassignmentModal.athlete.firstName} ${reassignmentModal.athlete.lastName} wurde zu "${reassignmentModal.toGroupName}" verschoben`);
      setTimeout(() => setSuccess(null), 3000);
      
      // Reset modal and dragged state
      setReassignmentModal({
        isOpen: false,
        athlete: null,
        fromGroupId: null,
        toGroupId: null,
        fromGroupName: '',
        toGroupName: '',
      });
      setReassignmentReason('');
      setDraggedAthlete(null);
      
      // Refresh data
      await fetchSessionData();
    } catch (err) {
      console.error('Error reassigning athlete:', err);
      setError('Fehler beim Verschieben des Athleten');
    }
  };

  const cancelReassignment = () => {
    setReassignmentModal({
      isOpen: false,
      athlete: null,
      fromGroupId: null,
      toGroupId: null,
      fromGroupName: '',
      toGroupName: '',
    });
    setReassignmentReason('');
    setDraggedAthlete(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Save exercises and notes for each group
      const groupUpdates = Object.keys(groupExercises).map(async (groupId) => {
        const response = await fetch(`/api/trainer/sessions/${date}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionGroupId: groupId,
            exercises: groupExercises[groupId] || null,
            notes: groupNotes[groupId] || null,
          }),
        });
        if (!response.ok) throw new Error('Failed to save group data');
      });

      // Save attendance for each session
      const attendanceUpdates = sessions.map(async (session) => {
        const athleteAttendance = attendance[session.id] || {};
        const attendanceRecords = Object.entries(athleteAttendance).map(
          ([athleteId, status]) => ({
            athleteId,
            status,
          })
        );

        const response = await fetch(`/api/trainer/sessions/${date}/attendance`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: session.id,
            attendance: attendanceRecords,
          }),
        });
        if (!response.ok) throw new Error('Failed to save attendance');
      });

      await Promise.all([...groupUpdates, ...attendanceUpdates]);

      setSuccess('Alle Änderungen gespeichert!');
      setTimeout(() => setSuccess(null), 3000);
      await fetchSessionData();
    } catch (err) {
      console.error('Error saving session:', err);
      setError('Fehler beim Speichern der Daten');
    } finally {
      setSaving(false);
    }
  };

  const getAttendanceButtonVariant = (sessionId: string, athleteId: string, targetStatus: string): 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' => {
    const currentStatus = attendance[sessionId]?.[athleteId];
    if (currentStatus === targetStatus) {
      if (targetStatus === 'PRESENT') return 'primary';
      if (targetStatus === 'ABSENT_EXCUSED') return 'secondary';
      if (targetStatus === 'ABSENT_UNEXCUSED') return 'danger';
    }
    return 'outline';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const formattedDate = date ? format(new Date(date), 'EEEE, d. MMMM yyyy', { locale: de }) : '';
  const isPastSession = date ? isPast(new Date(date)) : false;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Training bearbeiten</h1>
            <p className="text-gray-600 mt-1">
              {formattedDate}
              {isPastSession && <span className="ml-2 text-orange-600 font-medium">(Vergangene Session)</span>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchPreviousWeekExercises}
            disabled={loadingPrevious}
          >
            <Eye className="h-4 w-4 mr-2" />
            {loadingPrevious ? 'Lade...' : 'Letzte Woche'}
          </Button>
          <Button onClick={handleSave} disabled={saving} size="lg" className="bg-teal-600 hover:bg-teal-700">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Speichern...' : 'Speichern'}
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Cancellations Section */}
      {cancellations.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Absagen ({cancellations.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cancellations.map((cancellation) => (
              <div key={cancellation.id} className="p-3 bg-white rounded-lg border border-orange-200">
                <p className="font-medium text-gray-900">
                  {cancellation.athlete.firstName} {cancellation.athlete.lastName}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Grund:</span> {cancellation.reason}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Abgesagt am: {format(new Date(cancellation.cancelledAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sessions */}
      {sessions.length === 0 ? (
        <Alert variant="default">
          <p>Keine Trainingssessions für dieses Datum gefunden.</p>
          <p className="text-sm mt-2">
            Der Admin muss zunächst wiederkehrende Trainings erstellen und Sessions generieren.
          </p>
        </Alert>
      ) : (
        <div className="space-y-6">
          {sessions.map((session) => (
            <div key={session.id} className="space-y-4">
              {/* Session Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {session.recurringTraining?.name || 'Training'}
                  </h2>
                  {session.startTime && session.endTime && (
                    <p className="text-sm text-gray-600">
                      {session.startTime} - {session.endTime}
                    </p>
                  )}
                </div>
              </div>

              {/* Groups within this session */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {session.groups.map((group) => {
                  const isCancelled = session.isCancelled;
                  const trainers = group.trainerAssignments
                    .map((assignment) => assignment.trainer)
                    .filter((t): t is Trainer => t !== null);

                  return (
                    <Card
                      key={group.id}
                      className={`border-2 ${isCancelled ? 'border-red-300 bg-red-50' : 'border-teal-200'}`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDrop(session.id, group.id);
                      }}
                    >
                      <CardHeader className={isCancelled ? 'bg-red-100' : 'bg-teal-50'}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{group.trainingGroup.name}</CardTitle>
                            {group.trainingGroup.description && (
                              <p className="text-sm text-gray-600 mt-1">{group.trainingGroup.description}</p>
                            )}
                            {trainers.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                Trainer: {trainers.map((t) => `${t.firstName} ${t.lastName}`).join(', ')}
                              </p>
                            )}
                          </div>
                          {!isCancelled && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAllPresent(session.id, group.id)}
                            >
                              <Users className="h-4 w-4 mr-1" />
                              Alle
                            </Button>
                          )}
                        </div>
                        {isCancelled && (
                          <Alert variant="error" className="mt-3">
                            <p className="font-semibold">Session abgesagt</p>
                            {session.cancellationReason && (
                              <p className="text-sm mt-1">{session.cancellationReason}</p>
                            )}
                          </Alert>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4 pt-4">
                        {/* Exercises */}
                        <div>
                          <Label htmlFor={`exercises-${group.id}`}>Übungen</Label>
                          <Textarea
                            id={`exercises-${group.id}`}
                            value={groupExercises[group.id] || ''}
                            onChange={(e) =>
                              setGroupExercises((prev) => ({
                                ...prev,
                                [group.id]: e.target.value,
                              }))
                            }
                            rows={4}
                            placeholder="Übungen für diese Gruppe eingeben..."
                            className="mt-1"
                            disabled={isCancelled}
                          />
                        </div>

                        {/* Notes */}
                        <div>
                          <Label htmlFor={`notes-${group.id}`}>Notizen (optional)</Label>
                          <Input
                            id={`notes-${group.id}`}
                            value={groupNotes[group.id] || ''}
                            onChange={(e) =>
                              setGroupNotes((prev) => ({
                                ...prev,
                                [group.id]: e.target.value,
                              }))
                            }
                            placeholder="Notizen..."
                            className="mt-1"
                            disabled={isCancelled}
                          />
                        </div>

                        {/* Athletes */}
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Athleten ({group.athletes.length})</p>
                          {group.athletes.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">Keine Athleten zugewiesen</p>
                          ) : (
                            <div className="space-y-2">
                              {group.athletes.map((athlete) => {
                                const birthYear = new Date(athlete.birthDate).getFullYear();
                                const isCancelledByAthlete = cancellations.some((c) => c.athleteId === athlete.id);
                                
                                return (
                                  <div
                                    key={athlete.id}
                                    draggable={!isCancelled && !isCancelledByAthlete}
                                    onDragStart={() => handleDragStart(athlete, group.id)}
                                    className={`p-3 rounded-lg border cursor-move ${
                                      isCancelledByAthlete || isCancelled
                                        ? 'bg-gray-100 border-gray-300 opacity-60'
                                        : athlete.isTemporarilyReassigned
                                        ? 'bg-blue-50 border-blue-300'
                                        : 'bg-white border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      {!isCancelled && !isCancelledByAthlete && (
                                        <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm">
                                          {athlete.lastName}, {athlete.firstName}{' '}
                                          <span className="text-gray-500">({birthYear})</span>
                                          {isCancelledByAthlete && (
                                            <span className="ml-2 text-orange-600 text-xs">(Abgesagt)</span>
                                          )}
                                          {athlete.isTemporarilyReassigned && (
                                            <span className="ml-2 text-blue-600 text-xs flex items-center gap-1">
                                              <ArrowRightLeft className="h-3 w-3" />
                                              Temporär verschoben
                                            </span>
                                          )}
                                        </p>
                                        {athlete.isTemporarilyReassigned && athlete.reassignmentReason && (
                                          <p className="text-xs text-gray-600 mt-1">
                                            Grund: {athlete.reassignmentReason}
                                          </p>
                                        )}
                                        {!isCancelled && (
                                          <div className="flex gap-1 mt-2">
                                            <Button
                                              size="sm"
                                              variant={getAttendanceButtonVariant(session.id, athlete.id, 'PRESENT')}
                                              onClick={() => handleAttendanceChange(session.id, athlete.id, 'PRESENT')}
                                              className="flex-1 h-8 text-xs"
                                            >
                                              <Check className="h-3 w-3 mr-1" />
                                              Anwesend
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant={getAttendanceButtonVariant(session.id, athlete.id, 'ABSENT_EXCUSED')}
                                              onClick={() => handleAttendanceChange(session.id, athlete.id, 'ABSENT_EXCUSED')}
                                              className="flex-1 h-8 text-xs"
                                            >
                                              <AlertCircle className="h-3 w-3 mr-1" />
                                              Entschuldigt
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant={getAttendanceButtonVariant(session.id, athlete.id, 'ABSENT_UNEXCUSED')}
                                              onClick={() => handleAttendanceChange(session.id, athlete.id, 'ABSENT_UNEXCUSED')}
                                              className="flex-1 h-8 text-xs"
                                            >
                                              <X className="h-3 w-3 mr-1" />
                                              Fehlt
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reassignment Confirmation Modal */}
      {reassignmentModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Athlet verschieben bestätigen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Möchten Sie <strong>{reassignmentModal.athlete?.firstName} {reassignmentModal.athlete?.lastName}</strong>{' '}
                von <strong>{reassignmentModal.fromGroupName}</strong> nach <strong>{reassignmentModal.toGroupName}</strong> verschieben?
              </p>
              <p className="text-sm text-gray-600">
                Dies ist eine temporäre Änderung nur für diese Session.
              </p>
              <div>
                <Label htmlFor="reassignment-reason">Grund (optional)</Label>
                <Input
                  id="reassignment-reason"
                  value={reassignmentReason}
                  onChange={(e) => setReassignmentReason(e.target.value)}
                  placeholder="z.B. Leistungsanpassung, Gruppengröße"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={cancelReassignment}>
                  Abbrechen
                </Button>
                <Button onClick={confirmReassignment} className="bg-teal-600 hover:bg-teal-700">
                  Verschieben
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sticky Save Button */}
      {sessions.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
          <div className="max-w-7xl mx-auto flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={fetchPreviousWeekExercises}
              disabled={loadingPrevious}
            >
              <Eye className="h-4 w-4 mr-2" />
              {loadingPrevious ? 'Lade...' : 'Letzte Woche'}
            </Button>
            <Button onClick={handleSave} disabled={saving} size="lg" className="bg-teal-600 hover:bg-teal-700">
              <Save className="h-5 w-5 mr-2" />
              {saving ? 'Speichern...' : 'Alle Änderungen speichern'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
