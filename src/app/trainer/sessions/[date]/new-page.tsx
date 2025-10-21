'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { ArrowLeft, Save, Check, X, AlertCircle, Users } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { de } from 'date-fns/locale';

interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
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

interface SessionData {
  id: string;
  date: string;
  dayOfWeek: string;
  startTime: string | null;
  endTime: string | null;
  groupNumber: number;
  isCancelled: boolean;
  cancellationReason: string | null;
  attendanceRecords: AttendanceRecord[];
}

export default function NewSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const date = params.date as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [athletesBySession, setAthletesBySession] = useState<Record<string, Athlete[]>>({});
  const [cancellations, setCancellations] = useState<Cancellation[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Record<string, string>>>({});

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
      setAthletesBySession(data.athletesBySession || {});
      setCancellations(data.cancellations || []);

      // Initialize attendance state
      const attendanceState: Record<string, Record<string, string>> = {};
      
      data.sessions?.forEach((session: SessionData) => {
        attendanceState[session.id] = {};
        const athletes = data.athletesBySession[session.id] || [];
        
        athletes.forEach((athlete: Athlete) => {
          const existing = session.attendanceRecords?.find(
            (record: AttendanceRecord) => record.athleteId === athlete.id
          );
          attendanceState[session.id][athlete.id] = existing?.status || 'PRESENT';
        });
      });

      setAttendance(attendanceState);
    } catch (err) {
      console.error('Error fetching session:', err);
      setError('Fehler beim Laden der Session-Daten');
    } finally {
      setLoading(false);
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

  const handleMarkAllPresent = (sessionId: string) => {
    const athletes = athletesBySession[sessionId] || [];
    
    setAttendance((prev) => {
      const newAttendance = { ...prev };
      newAttendance[sessionId] = {};
      athletes.forEach((athlete) => {
        newAttendance[sessionId][athlete.id] = 'PRESENT';
      });
      return newAttendance;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Prepare updates for all sessions
      const updates = sessions.map((session) => {
        const athleteAttendance = attendance[session.id] || {};
        const attendanceRecords = Object.entries(athleteAttendance).map(
          ([athleteId, status]) => ({
            athleteId,
            status,
          })
        );

        return {
          sessionId: session.id,
          attendance: attendanceRecords,
        };
      });

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

  const getAttendanceButtonStyle = (sessionId: string, athleteId: string, targetStatus: string) => {
    const currentStatus = attendance[sessionId]?.[athleteId];
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

      {/* Sessions */}
      {sessions.length === 0 ? (
        <Alert variant="default">
          <p>Keine Trainingssessions für dieses Datum gefunden.</p>
          <p className="text-sm mt-2">
            Der Admin muss zunächst wiederkehrende Trainings erstellen und Sessions generieren.
          </p>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {sessions.map((session) => {
            const athletes = athletesBySession[session.id] || [];
            const isCancelled = session.isCancelled;

            return (
              <Card
                key={session.id}
                className={isCancelled ? 'border-2 border-red-300 bg-red-50' : 'border-2 border-teal-200'}
              >
                <CardHeader className={isCancelled ? 'bg-red-100' : 'bg-teal-50'}>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Gruppe {session.groupNumber}</CardTitle>
                      {session.startTime && session.endTime && (
                        <p className="text-sm text-gray-600 mt-1">
                          {session.startTime} - {session.endTime}
                        </p>
                      )}
                    </div>
                    {!isCancelled && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAllPresent(session.id)}
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
                  {/* Athletes */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Athleten ({athletes.length})</p>
                    {athletes.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">Keine Athleten zugewiesen</p>
                    ) : (
                      <div className="space-y-3">
                        {athletes.map((athlete) => {
                          const birthYear = new Date(athlete.birthDate).getFullYear();
                          const isCancelledByAthlete = cancellations.some((c) => c.athleteId === athlete.id);
                          
                          return (
                            <div
                              key={athlete.id}
                              className={`p-3 rounded-lg border ${
                                isCancelledByAthlete || isCancelled
                                  ? 'bg-gray-100 border-gray-300 opacity-60'
                                  : 'bg-white border-gray-200'
                              }`}
                            >
                              <p className="font-medium text-sm">
                                {athlete.lastName}, {athlete.firstName}{' '}
                                <span className="text-gray-500">({birthYear})</span>
                                {isCancelledByAthlete && (
                                  <span className="ml-2 text-orange-600 text-xs">(Abgesagt)</span>
                                )}
                              </p>
                              {!isCancelled && (
                                <div className="flex gap-1 mt-2">
                                  <Button
                                    size="sm"
                                    variant={getAttendanceButtonStyle(session.id, athlete.id, 'PRESENT')}
                                    onClick={() => handleAttendanceChange(session.id, athlete.id, 'PRESENT')}
                                    className="flex-1 h-8 text-xs"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={getAttendanceButtonStyle(session.id, athlete.id, 'ABSENT_EXCUSED')}
                                    onClick={() => handleAttendanceChange(session.id, athlete.id, 'ABSENT_EXCUSED')}
                                    className="flex-1 h-8 text-xs"
                                  >
                                    <AlertCircle className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={getAttendanceButtonStyle(session.id, athlete.id, 'ABSENT_UNEXCUSED')}
                                    onClick={() => handleAttendanceChange(session.id, athlete.id, 'ABSENT_UNEXCUSED')}
                                    className="flex-1 h-8 text-xs"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
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
      )}

      {/* Sticky Save Button */}
      {sessions.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
          <div className="max-w-7xl mx-auto flex justify-end">
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
