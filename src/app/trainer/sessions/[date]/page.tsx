'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { ArrowLeft, Save, Check, X, AlertCircle, Users } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { de } from 'date-fns/locale';

interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  youthCategory: string;
  groupAssignments: Array<{
    groupNumber: number;
    hourNumber: number;
    trainingDay: string;
  }>;
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

interface AttendanceRecord {
  id: string;
  athleteId: string;
  status: 'PRESENT' | 'ABSENT_UNEXCUSED' | 'ABSENT_EXCUSED';
}

interface TrainerAssignment {
  id: string;
  trainerId: string;
  trainer: {
    firstName: string;
    lastName: string;
  };
}

interface SessionData {
  id: string;
  date: string;
  dayOfWeek: string;
  hourNumber: number;
  groupNumber: number;
  equipment1: string | null;
  equipment2: string | null;
  notes: string | null;
  attendanceRecords: AttendanceRecord[];
  trainerAssignments: TrainerAssignment[];
}

interface Trainer {
  id: string;
  firstName: string;
  lastName: string;
}

interface SessionsByHourAndGroup {
  [hour: number]: {
    [group: number]: {
      session: SessionData;
      athletes: Athlete[];
    };
  };
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const date = params.date as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionsByHourAndGroup>({});
  const [cancellations, setCancellations] = useState<Cancellation[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Record<string, string>>>({});
  const [equipment, setEquipment] = useState<Record<string, { equipment1: string; equipment2: string }>>({});
  const [sessionNotes, setSessionNotes] = useState<Record<string, string>>({});
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [trainerAssignments, setTrainerAssignments] = useState<Record<string, string[]>>({});

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
      
      // Organize sessions by hour and group
      const organizedSessions: SessionsByHourAndGroup = {};
      const attendanceState: Record<string, Record<string, string>> = {};
      const equipmentState: Record<string, { equipment1: string; equipment2: string }> = {};
      const notesState: Record<string, string> = {};
      const trainerState: Record<string, string[]> = {};

      // Group athletes by their assignments
      data.sessions.forEach((session: SessionData) => {
        const hour = session.hourNumber;
        const group = session.groupNumber;
        const sessionKey = `${hour}-${group}`;

        if (!organizedSessions[hour]) {
          organizedSessions[hour] = {};
        }

        // Filter athletes for this specific session
        const sessionAthletes = data.scheduledAthletes.filter((athlete: Athlete) =>
          athlete.groupAssignments.some(
            (assignment) =>
              assignment.hourNumber === hour &&
              assignment.groupNumber === group &&
              assignment.trainingDay === session.dayOfWeek
          )
        );

        organizedSessions[hour][group] = {
          session,
          athletes: sessionAthletes,
        };

        // Initialize attendance for this session
        attendanceState[sessionKey] = {};
        sessionAthletes.forEach((athlete: Athlete) => {
          const existing = session.attendanceRecords?.find(
            (record: AttendanceRecord) => record.athleteId === athlete.id
          );
          attendanceState[sessionKey][athlete.id] = existing?.status || 'PRESENT';
        });

        // Initialize equipment
        equipmentState[sessionKey] = {
          equipment1: session.equipment1 || '',
          equipment2: session.equipment2 || '',
        };

        // Initialize notes
        notesState[sessionKey] = session.notes || '';

        // Initialize trainer assignments (up to 2 trainers)
        trainerState[sessionKey] = session.trainerAssignments?.map(ta => ta.trainerId) || [];
      });

      setSessions(organizedSessions);
      setAttendance(attendanceState);
      setEquipment(equipmentState);
      setSessionNotes(notesState);
      setTrainerAssignments(trainerState);
      setCancellations(data.cancellations || []);
      setTrainers(data.trainers || []);
    } catch (err) {
      console.error('Error fetching session:', err);
      setError('Fehler beim Laden der Session-Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (sessionKey: string, athleteId: string, status: string) => {
    setAttendance((prev) => ({
      ...prev,
      [sessionKey]: {
        ...prev[sessionKey],
        [athleteId]: status,
      },
    }));
  };

  const handleMarkAllPresent = (sessionKey: string) => {
    const [hour, group] = sessionKey.split('-').map(Number);
    const athletes = sessions[hour]?.[group]?.athletes || [];
    
    setAttendance((prev) => {
      const newAttendance = { ...prev };
      newAttendance[sessionKey] = {};
      athletes.forEach((athlete) => {
        newAttendance[sessionKey][athlete.id] = 'PRESENT';
      });
      return newAttendance;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Prepare updates for all sessions
      const updates = [];

      for (const [sessionKey, athleteAttendance] of Object.entries(attendance)) {
        const [hour, group] = sessionKey.split('-').map(Number);
        const sessionData = sessions[hour]?.[group]?.session;

        if (sessionData) {
          const attendanceRecords = Object.entries(athleteAttendance).map(([athleteId, status]) => ({
            athleteId,
            status,
          }));

          updates.push({
            sessionId: sessionData.id,
            attendance: attendanceRecords,
            equipment1: equipment[sessionKey]?.equipment1 || null,
            equipment2: equipment[sessionKey]?.equipment2 || null,
            notes: sessionNotes[sessionKey] || null,
            trainerIds: trainerAssignments[sessionKey] || [],
          });
        }
      }

      // Send all updates
      const response = await fetch(`/api/trainer/sessions/${date}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) throw new Error('Failed to save session data');

      setSuccess('Session erfolgreich gespeichert!');
      setTimeout(() => setSuccess(null), 3000);
      await fetchSessionData();
    } catch (err) {
      console.error('Error saving session:', err);
      setError('Fehler beim Speichern der Session');
    } finally {
      setSaving(false);
    }
  };

  const getAttendanceButtonStyle = (sessionKey: string, athleteId: string, targetStatus: string) => {
    const currentStatus = attendance[sessionKey]?.[athleteId];
    if (currentStatus === targetStatus) {
      if (targetStatus === 'PRESENT') return 'primary';
      if (targetStatus === 'ABSENT_EXCUSED') return 'primary';
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
            <h1 className="text-2xl font-bold text-gray-900">Anwesenheit markieren</h1>
            <p className="text-gray-600 mt-1">
              {formattedDate}
              {isPastSession && <span className="ml-2 text-orange-600 font-medium">(Vergangene Session)</span>}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} size="lg" className="bg-teal-600 hover:bg-teal-700">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Speichern...' : 'Speichern'}
        </Button>
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

      {/* 1. Stunde */}
      {sessions[1] && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">1. Stunde</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((groupNum) => {
              const sessionData = sessions[1]?.[groupNum];
              if (!sessionData) return null;

              const sessionKey = `1-${groupNum}`;
              const { athletes } = sessionData;

              return (
                <Card key={groupNum} className="border-2 border-teal-200">
                  <CardHeader className="bg-teal-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Gruppe {groupNum}</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAllPresent(sessionKey)}
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Alle anwesend
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    {/* Athletes */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Athleten ({athletes.length})</Label>
                      {athletes.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">Keine Athleten zugewiesen</p>
                      ) : (
                        <div className="space-y-3">
                          {athletes.map((athlete) => {
                            const birthYear = new Date(athlete.birthDate).getFullYear();
                            const isCancelled = cancellations.some((c) => c.athleteId === athlete.id);
                            
                            return (
                              <div
                                key={athlete.id}
                                className={`p-3 rounded-lg border ${
                                  isCancelled
                                    ? 'bg-gray-100 border-gray-300 opacity-60'
                                    : 'bg-white border-gray-200'
                                }`}
                              >
                                <p className="font-medium text-sm">
                                  {athlete.lastName}, {athlete.firstName}{' '}
                                  <span className="text-gray-500">({birthYear})</span>
                                  {isCancelled && <span className="ml-2 text-orange-600 text-xs">(Abgesagt)</span>}
                                </p>
                                <div className="flex gap-1 mt-2">
                                  <Button
                                    size="sm"
                                    variant={getAttendanceButtonStyle(sessionKey, athlete.id, 'PRESENT')}
                                    onClick={() => handleAttendanceChange(sessionKey, athlete.id, 'PRESENT')}
                                    className="flex-1 h-8 text-xs"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={getAttendanceButtonStyle(sessionKey, athlete.id, 'ABSENT_EXCUSED')}
                                    onClick={() => handleAttendanceChange(sessionKey, athlete.id, 'ABSENT_EXCUSED')}
                                    className="flex-1 h-8 text-xs"
                                  >
                                    <AlertCircle className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={getAttendanceButtonStyle(sessionKey, athlete.id, 'ABSENT_UNEXCUSED')}
                                    onClick={() => handleAttendanceChange(sessionKey, athlete.id, 'ABSENT_UNEXCUSED')}
                                    className="flex-1 h-8 text-xs"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Equipment */}
                    <div className="space-y-2 pt-4 border-t">
                      <Label className="text-sm font-semibold">Geräte</Label>
                      <div className="space-y-2">
                        <div>
                          <Label htmlFor={`equipment1-${sessionKey}`} className="text-xs">
                            Startgerät
                          </Label>
                          <Input
                            id={`equipment1-${sessionKey}`}
                            value={equipment[sessionKey]?.equipment1 || ''}
                            onChange={(e) =>
                              setEquipment((prev) => ({
                                ...prev,
                                [sessionKey]: { ...prev[sessionKey], equipment1: e.target.value },
                              }))
                            }
                            placeholder="z.B. Boden"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`equipment2-${sessionKey}`} className="text-xs">
                            2. Gerät
                          </Label>
                          <Input
                            id={`equipment2-${sessionKey}`}
                            value={equipment[sessionKey]?.equipment2 || ''}
                            onChange={(e) =>
                              setEquipment((prev) => ({
                                ...prev,
                                [sessionKey]: { ...prev[sessionKey], equipment2: e.target.value },
                              }))
                            }
                            placeholder="z.B. Reck"
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Trainer Assignment */}
                    {trainers.length > 0 && (
                      <div className="space-y-2 pt-4 border-t">
                        <Label className="text-sm font-semibold">
                          Übungsleiter (1-2 Trainer)
                        </Label>
                        <div className="space-y-2">
                          <div>
                            <Label htmlFor={`trainer1-${sessionKey}`} className="text-xs text-gray-600">
                              Übungsleiter 1 (Pflicht)
                            </Label>
                            <select
                              id={`trainer1-${sessionKey}`}
                              value={trainerAssignments[sessionKey]?.[0] || ''}
                              onChange={(e) => {
                                const newTrainers = [...(trainerAssignments[sessionKey] || [])];
                                if (e.target.value) {
                                  newTrainers[0] = e.target.value;
                                } else {
                                  newTrainers.splice(0, 1);
                                }
                                setTrainerAssignments((prev) => ({
                                  ...prev,
                                  [sessionKey]: newTrainers,
                                }));
                              }}
                              className="w-full h-8 text-sm border border-gray-300 rounded-md px-2"
                            >
                              <option value="">Nicht zugewiesen</option>
                              {trainers.map((trainer) => (
                                <option 
                                  key={trainer.id} 
                                  value={trainer.id}
                                  disabled={trainerAssignments[sessionKey]?.[1] === trainer.id}
                                >
                                  {trainer.firstName} {trainer.lastName}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label htmlFor={`trainer2-${sessionKey}`} className="text-xs text-gray-600">
                              Übungsleiter 2 (Optional)
                            </Label>
                            <select
                              id={`trainer2-${sessionKey}`}
                              value={trainerAssignments[sessionKey]?.[1] || ''}
                              onChange={(e) => {
                                const newTrainers = [...(trainerAssignments[sessionKey] || [])];
                                if (e.target.value) {
                                  // Ensure we have at least trainer 1 selected
                                  if (!newTrainers[0]) {
                                    return; // Can't select trainer 2 without trainer 1
                                  }
                                  newTrainers[1] = e.target.value;
                                } else {
                                  newTrainers.splice(1, 1);
                                }
                                setTrainerAssignments((prev) => ({
                                  ...prev,
                                  [sessionKey]: newTrainers,
                                }));
                              }}
                              className="w-full h-8 text-sm border border-gray-300 rounded-md px-2"
                              disabled={!trainerAssignments[sessionKey]?.[0]}
                            >
                              <option value="">Nicht zugewiesen</option>
                              {trainers.map((trainer) => (
                                <option 
                                  key={trainer.id} 
                                  value={trainer.id}
                                  disabled={trainerAssignments[sessionKey]?.[0] === trainer.id}
                                >
                                  {trainer.firstName} {trainer.lastName}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Stunde */}
      {sessions[2] && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">2. Stunde</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((groupNum) => {
              const sessionData = sessions[2]?.[groupNum];
              if (!sessionData) return null;

              const sessionKey = `2-${groupNum}`;
              const { athletes } = sessionData;

              return (
                <Card key={groupNum} className="border-2 border-teal-200">
                  <CardHeader className="bg-teal-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Gruppe {groupNum}</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAllPresent(sessionKey)}
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Alle anwesend
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    {/* Athletes */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Athleten ({athletes.length})</Label>
                      {athletes.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">Keine Athleten zugewiesen</p>
                      ) : (
                        <div className="space-y-3">
                          {athletes.map((athlete) => {
                            const birthYear = new Date(athlete.birthDate).getFullYear();
                            const isCancelled = cancellations.some((c) => c.athleteId === athlete.id);
                            
                            return (
                              <div
                                key={athlete.id}
                                className={`p-3 rounded-lg border ${
                                  isCancelled
                                    ? 'bg-gray-100 border-gray-300 opacity-60'
                                    : 'bg-white border-gray-200'
                                }`}
                              >
                                <p className="font-medium text-sm">
                                  {athlete.lastName}, {athlete.firstName}{' '}
                                  <span className="text-gray-500">({birthYear})</span>
                                  {isCancelled && <span className="ml-2 text-orange-600 text-xs">(Abgesagt)</span>}
                                </p>
                                <div className="flex gap-1 mt-2">
                                  <Button
                                    size="sm"
                                    variant={getAttendanceButtonStyle(sessionKey, athlete.id, 'PRESENT')}
                                    onClick={() => handleAttendanceChange(sessionKey, athlete.id, 'PRESENT')}
                                    className="flex-1 h-8 text-xs"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={getAttendanceButtonStyle(sessionKey, athlete.id, 'ABSENT_EXCUSED')}
                                    onClick={() => handleAttendanceChange(sessionKey, athlete.id, 'ABSENT_EXCUSED')}
                                    className="flex-1 h-8 text-xs"
                                  >
                                    <AlertCircle className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={getAttendanceButtonStyle(sessionKey, athlete.id, 'ABSENT_UNEXCUSED')}
                                    onClick={() => handleAttendanceChange(sessionKey, athlete.id, 'ABSENT_UNEXCUSED')}
                                    className="flex-1 h-8 text-xs"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Equipment */}
                    <div className="space-y-2 pt-4 border-t">
                      <Label className="text-sm font-semibold">Geräte</Label>
                      <div className="space-y-2">
                        <div>
                          <Label htmlFor={`equipment1-${sessionKey}`} className="text-xs">
                            Startgerät
                          </Label>
                          <Input
                            id={`equipment1-${sessionKey}`}
                            value={equipment[sessionKey]?.equipment1 || ''}
                            onChange={(e) =>
                              setEquipment((prev) => ({
                                ...prev,
                                [sessionKey]: { ...prev[sessionKey], equipment1: e.target.value },
                              }))
                            }
                            placeholder="z.B. Boden"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`equipment2-${sessionKey}`} className="text-xs">
                            2. Gerät
                          </Label>
                          <Input
                            id={`equipment2-${sessionKey}`}
                            value={equipment[sessionKey]?.equipment2 || ''}
                            onChange={(e) =>
                              setEquipment((prev) => ({
                                ...prev,
                                [sessionKey]: { ...prev[sessionKey], equipment2: e.target.value },
                              }))
                            }
                            placeholder="z.B. Reck"
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Trainer Assignment */}
                    {trainers.length > 0 && (
                      <div className="space-y-2 pt-4 border-t">
                        <Label className="text-sm font-semibold">
                          Übungsleiter (1-2 Trainer)
                        </Label>
                        <div className="space-y-2">
                          <div>
                            <Label htmlFor={`trainer1-${sessionKey}`} className="text-xs text-gray-600">
                              Übungsleiter 1 (Pflicht)
                            </Label>
                            <select
                              id={`trainer1-${sessionKey}`}
                              value={trainerAssignments[sessionKey]?.[0] || ''}
                              onChange={(e) => {
                                const newTrainers = [...(trainerAssignments[sessionKey] || [])];
                                if (e.target.value) {
                                  newTrainers[0] = e.target.value;
                                } else {
                                  newTrainers.splice(0, 1);
                                }
                                setTrainerAssignments((prev) => ({
                                  ...prev,
                                  [sessionKey]: newTrainers,
                                }));
                              }}
                              className="w-full h-8 text-sm border border-gray-300 rounded-md px-2"
                            >
                              <option value="">Nicht zugewiesen</option>
                              {trainers.map((trainer) => (
                                <option 
                                  key={trainer.id} 
                                  value={trainer.id}
                                  disabled={trainerAssignments[sessionKey]?.[1] === trainer.id}
                                >
                                  {trainer.firstName} {trainer.lastName}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label htmlFor={`trainer2-${sessionKey}`} className="text-xs text-gray-600">
                              Übungsleiter 2 (Optional)
                            </Label>
                            <select
                              id={`trainer2-${sessionKey}`}
                              value={trainerAssignments[sessionKey]?.[1] || ''}
                              onChange={(e) => {
                                const newTrainers = [...(trainerAssignments[sessionKey] || [])];
                                if (e.target.value) {
                                  // Ensure we have at least trainer 1 selected
                                  if (!newTrainers[0]) {
                                    return; // Can't select trainer 2 without trainer 1
                                  }
                                  newTrainers[1] = e.target.value;
                                } else {
                                  newTrainers.splice(1, 1);
                                }
                                setTrainerAssignments((prev) => ({
                                  ...prev,
                                  [sessionKey]: newTrainers,
                                }));
                              }}
                              className="w-full h-8 text-sm border border-gray-300 rounded-md px-2"
                              disabled={!trainerAssignments[sessionKey]?.[0]}
                            >
                              <option value="">Nicht zugewiesen</option>
                              {trainers.map((trainer) => (
                                <option 
                                  key={trainer.id} 
                                  value={trainer.id}
                                  disabled={trainerAssignments[sessionKey]?.[0] === trainer.id}
                                >
                                  {trainer.firstName} {trainer.lastName}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* General Session Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Allgemeine Notizen</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={sessionNotes['general'] || ''}
            onChange={(e) => setSessionNotes((prev) => ({ ...prev, general: e.target.value }))}
            placeholder="Notizen zur gesamten Session..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Sticky Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
        <div className="max-w-7xl mx-auto flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg" className="bg-teal-600 hover:bg-teal-700">
            <Save className="h-5 w-5 mr-2" />
            {saving ? 'Speichern...' : 'Alle Änderungen speichern'}
          </Button>
        </div>
      </div>
    </div>
  );
}