'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { ArrowLeft, Save, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  status: 'PRESENT' | 'ABSENT_UNEXCUSED' | 'ABSENT_EXCUSED' | null;
  cancelled: boolean;
  cancellationReason?: string;
}

interface SessionGroup {
  groupNumber: number;
  hourNumber: number;
  sessionId: string;
  athletes: Athlete[];
  equipment1: string;
  equipment2: string;
  notes: string;
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionDate = params.date as string;

  const [sessions, setSessions] = useState<SessionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSessionData();
  }, [sessionDate]);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/trainer/sessions/${sessionDate}`);
      if (!response.ok) throw new Error('Failed to fetch session data');
      const data = await response.json();
      setSessions(data.sessions);
    } catch (err) {
      setError('Fehler beim Laden der Session-Daten');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (
    groupIndex: number,
    athleteId: string,
    newStatus: 'PRESENT' | 'ABSENT_UNEXCUSED' | 'ABSENT_EXCUSED'
  ) => {
    setSessions((prev) => {
      const updated = [...prev];
      const athlete = updated[groupIndex].athletes.find((a) => a.id === athleteId);
      if (athlete) {
        athlete.status = newStatus;
      }
      return updated;
    });
  };

  const handleEquipmentChange = (
    groupIndex: number,
    field: 'equipment1' | 'equipment2',
    value: string
  ) => {
    setSessions((prev) => {
      const updated = [...prev];
      updated[groupIndex][field] = value;
      return updated;
    });
  };

  const handleNotesChange = (groupIndex: number, value: string) => {
    setSessions((prev) => {
      const updated = [...prev];
      updated[groupIndex].notes = value;
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Prepare data for API
      const updates = sessions.map((group) => ({
        sessionId: group.sessionId,
        equipment1: group.equipment1,
        equipment2: group.equipment2,
        notes: group.notes,
        attendance: group.athletes
          .filter((a) => !a.cancelled && a.status !== null)
          .map((a) => ({
            athleteId: a.id,
            status: a.status,
          })),
      }));

      const response = await fetch(`/api/trainer/sessions/${sessionDate}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save attendance');
      }

      setSuccess('Anwesenheit erfolgreich gespeichert!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern der Anwesenheit');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'ABSENT_EXCUSED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'ABSENT_UNEXCUSED':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="h-4 w-4" />;
      case 'ABSENT_EXCUSED':
        return <MinusCircle className="h-4 w-4" />;
      case 'ABSENT_UNEXCUSED':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'PRESENT':
        return 'Anwesend';
      case 'ABSENT_EXCUSED':
        return 'Entschuldigt';
      case 'ABSENT_UNEXCUSED':
        return 'Unentschuldigt';
      default:
        return 'Nicht markiert';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <div className="space-y-4">
        <Alert variant="error">{error}</Alert>
        <Button onClick={() => router.push('/trainer/sessions')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zur Übersicht
        </Button>
      </div>
    );
  }

  // Group sessions by hour and group for proper layout
  const hour1Groups = sessions.filter((s) => s.hourNumber === 1).sort((a, b) => a.groupNumber - b.groupNumber);
  const hour2Groups = sessions.filter((s) => s.hourNumber === 2).sort((a, b) => a.groupNumber - b.groupNumber);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.push('/trainer/sessions')} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {format(new Date(sessionDate), 'EEEE, dd. MMMM yyyy', { locale: de })}
            </h1>
            <p className="text-gray-600 mt-1">Anwesenheit markieren</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} variant="primary">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Wird gespeichert...' : 'Speichern'}
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {/* 1. Stunde */}
      {hour1Groups.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">1. Stunde (16:00 - 17:00)</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {hour1Groups.map((group, groupIndex) => {
              const actualIndex = sessions.findIndex(
                (s) => s.sessionId === group.sessionId
              );
              return (
                <Card key={group.sessionId}>
                  <CardHeader className="bg-orange-50">
                    <CardTitle className="text-lg">Gruppe {group.groupNumber}</CardTitle>
                    <p className="text-sm text-gray-600">
                      {group.athletes.filter((a) => !a.cancelled).length} Athleten
                    </p>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {/* Athletes List */}
                    <div className="space-y-2">
                      {group.athletes.map((athlete) => (
                        <div key={athlete.id} className="space-y-2">
                          <div className="font-medium text-sm">
                            {athlete.firstName} {athlete.lastName}
                          </div>
                          {athlete.cancelled ? (
                            <div className="text-xs text-gray-500 italic p-2 bg-gray-50 rounded">
                              Abgesagt: {athlete.cancellationReason}
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleStatusChange(actualIndex, athlete.id, 'PRESENT')
                                }
                                className={`flex-1 py-2 px-3 rounded border text-xs font-medium transition-colors ${
                                  athlete.status === 'PRESENT'
                                    ? 'bg-green-100 text-green-800 border-green-300'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <CheckCircle className="h-3 w-3 inline mr-1" />
                                ✓
                              </button>
                              <button
                                onClick={() =>
                                  handleStatusChange(actualIndex, athlete.id, 'ABSENT_EXCUSED')
                                }
                                className={`flex-1 py-2 px-3 rounded border text-xs font-medium transition-colors ${
                                  athlete.status === 'ABSENT_EXCUSED'
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <MinusCircle className="h-3 w-3 inline mr-1" />
                                ~
                              </button>
                              <button
                                onClick={() =>
                                  handleStatusChange(actualIndex, athlete.id, 'ABSENT_UNEXCUSED')
                                }
                                className={`flex-1 py-2 px-3 rounded border text-xs font-medium transition-colors ${
                                  athlete.status === 'ABSENT_UNEXCUSED'
                                    ? 'bg-red-100 text-red-800 border-red-300'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <XCircle className="h-3 w-3 inline mr-1" />
                                ✗
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Equipment */}
                    <div className="pt-4 border-t space-y-3">
                      <div>
                        <Label className="text-xs">Gerät 1</Label>
                        <Input
                          value={group.equipment1}
                          onChange={(e) =>
                            handleEquipmentChange(actualIndex, 'equipment1', e.target.value)
                          }
                          placeholder="z.B. Boden"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Gerät 2</Label>
                        <Input
                          value={group.equipment2}
                          onChange={(e) =>
                            handleEquipmentChange(actualIndex, 'equipment2', e.target.value)
                          }
                          placeholder="z.B. Balken"
                          className="text-sm"
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <Label className="text-xs">Notizen</Label>
                      <Textarea
                        value={group.notes}
                        onChange={(e) => handleNotesChange(actualIndex, e.target.value)}
                        placeholder="Session-Notizen..."
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Stunde */}
      {hour2Groups.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">2. Stunde (17:30 - 18:30)</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {hour2Groups.map((group, groupIndex) => {
              const actualIndex = sessions.findIndex(
                (s) => s.sessionId === group.sessionId
              );
              return (
                <Card key={group.sessionId}>
                  <CardHeader className="bg-teal-50">
                    <CardTitle className="text-lg">Gruppe {group.groupNumber}</CardTitle>
                    <p className="text-sm text-gray-600">
                      {group.athletes.filter((a) => !a.cancelled).length} Athleten
                    </p>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {/* Athletes List */}
                    <div className="space-y-2">
                      {group.athletes.map((athlete) => (
                        <div key={athlete.id} className="space-y-2">
                          <div className="font-medium text-sm">
                            {athlete.firstName} {athlete.lastName}
                          </div>
                          {athlete.cancelled ? (
                            <div className="text-xs text-gray-500 italic p-2 bg-gray-50 rounded">
                              Abgesagt: {athlete.cancellationReason}
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleStatusChange(actualIndex, athlete.id, 'PRESENT')
                                }
                                className={`flex-1 py-2 px-3 rounded border text-xs font-medium transition-colors ${
                                  athlete.status === 'PRESENT'
                                    ? 'bg-green-100 text-green-800 border-green-300'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <CheckCircle className="h-3 w-3 inline mr-1" />
                                ✓
                              </button>
                              <button
                                onClick={() =>
                                  handleStatusChange(actualIndex, athlete.id, 'ABSENT_EXCUSED')
                                }
                                className={`flex-1 py-2 px-3 rounded border text-xs font-medium transition-colors ${
                                  athlete.status === 'ABSENT_EXCUSED'
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <MinusCircle className="h-3 w-3 inline mr-1" />
                                ~
                              </button>
                              <button
                                onClick={() =>
                                  handleStatusChange(actualIndex, athlete.id, 'ABSENT_UNEXCUSED')
                                }
                                className={`flex-1 py-2 px-3 rounded border text-xs font-medium transition-colors ${
                                  athlete.status === 'ABSENT_UNEXCUSED'
                                    ? 'bg-red-100 text-red-800 border-red-300'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <XCircle className="h-3 w-3 inline mr-1" />
                                ✗
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Equipment */}
                    <div className="pt-4 border-t space-y-3">
                      <div>
                        <Label className="text-xs">Gerät 1</Label>
                        <Input
                          value={group.equipment1}
                          onChange={(e) =>
                            handleEquipmentChange(actualIndex, 'equipment1', e.target.value)
                          }
                          placeholder="z.B. Boden"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Gerät 2</Label>
                        <Input
                          value={group.equipment2}
                          onChange={(e) =>
                            handleEquipmentChange(actualIndex, 'equipment2', e.target.value)
                          }
                          placeholder="z.B. Balken"
                          className="text-sm"
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <Label className="text-xs">Notizen</Label>
                      <Textarea
                        value={group.notes}
                        onChange={(e) => handleNotesChange(actualIndex, e.target.value)}
                        placeholder="Session-Notizen..."
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Save Button (Bottom) */}
      <div className="flex justify-end pt-4 border-t sticky bottom-0 bg-gray-50 py-4">
        <Button onClick={handleSave} disabled={saving} variant="primary" size="lg">
          <Save className="h-5 w-5 mr-2" />
          {saving ? 'Wird gespeichert...' : 'Änderungen speichern'}
        </Button>
      </div>
    </div>
  );
}