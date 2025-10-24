'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Calendar, Users, FileText, CheckCircle } from 'lucide-react';
import { SessionEditor } from '@/components/trainer/session-editor';
import { AttendanceMarker } from '@/components/trainer/attendance-marker';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface SessionDetailContentProps {
  sessionId: string;
}

export function SessionDetailContent({ sessionId }: SessionDetailContentProps) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showExerciseEditor, setShowExerciseEditor] = useState(false);
  const [showAttendanceMarker, setShowAttendanceMarker] = useState(false);

  useEffect(() => {
    fetchSessionDetails();
    fetchSessionAthletes();
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      const response = await fetch(`/api/trainer/sessions/${sessionId}`);
      if (!response.ok) throw new Error('Fehler beim Laden der Trainingseinheit');

      const data = await response.json();
      setSession(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSessionAthletes = async () => {
    try {
      const response = await fetch(`/api/trainer/sessions/${sessionId}/athletes`);
      if (!response.ok) throw new Error('Fehler beim Laden der Athleten');

      const data = await response.json();
      setAthletes(data.data);
    } catch (err) {
      console.error('Error fetching athletes:', err);
    }
  };

  const handleSaveExercises = async (
    updates: Array<{ sessionGroupId: string; exercises: string; notes: string }>
  ) => {
    try {
      const response = await fetch(`/api/trainer/sessions/${sessionId}/exercises`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Speichern');
      }

      toast.success('Übungen erfolgreich gespeichert');
      setShowExerciseEditor(false);
      fetchSessionDetails();
    } catch (err) {
      throw err;
    }
  };

  const handleCopyFromPrevious = async (sessionGroupId: string): Promise<string> => {
    try {
      const response = await fetch(`/api/trainer/sessions/${sessionId}/copy-exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionGroupId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Kopieren');
      }

      const data = await response.json();
      return data.data.exercises || '';
    } catch (err) {
      throw err;
    }
  };

  const handleSaveAttendance = async (
    records: Array<{ athleteId: string; status: string; notes?: string }>
  ) => {
    try {
      const response = await fetch(`/api/trainer/sessions/${sessionId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Speichern');
      }

      toast.success('Anwesenheit erfolgreich gespeichert');
      setShowAttendanceMarker(false);
      
      // Mark session as completed
      await fetch(`/api/trainer/sessions/${sessionId}/complete`, {
        method: 'POST',
      });

      fetchSessionDetails();
    } catch (err) {
      throw err;
    }
  };

  if (isLoading) return <Loading />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!session) return null;

  const isPastSession = new Date(session.date) < new Date();
  const allAthletes = athletes.flatMap((group) => group.athletes);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          ← Zurück
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {session.recurringTraining?.name || 'Training'}
            </h1>
            <p className="text-muted-foreground">
              {formatDate(session.date)} • {session.startTime} - {session.endTime}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {session.isCancelled && <Badge variant="destructive">Abgesagt</Badge>}
            {session.isCompleted && <Badge variant="success">Abgeschlossen</Badge>}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!session.isCancelled && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setShowExerciseEditor(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Übungen bearbeiten
              </Button>
              {isPastSession && !session.isCompleted && (
                <Button onClick={() => setShowAttendanceMarker(true)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Anwesenheit markieren
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Details Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="groups">Gruppen</TabsTrigger>
          <TabsTrigger value="athletes">Athleten</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Groups Overview */}
          {session.groups.map((sessionGroup: any) => (
            <Card key={sessionGroup.id}>
              <CardHeader>
                <CardTitle>{sessionGroup.trainingGroup.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Trainer</h4>
                  <div className="flex flex-wrap gap-2">
                    {sessionGroup.trainerAssignments.map((assignment: any) => (
                      <Badge key={assignment.id} variant="secondary">
                        {assignment.trainer.firstName} {assignment.trainer.lastName}
                      </Badge>
                    ))}
                  </div>
                </div>
                {sessionGroup.exercises && (
                  <div>
                    <h4 className="font-medium mb-2">Übungen</h4>
                    <p className="text-sm whitespace-pre-wrap">{sessionGroup.exercises}</p>
                  </div>
                )}
                {sessionGroup.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Notizen</h4>
                    <p className="text-sm whitespace-pre-wrap">{sessionGroup.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="groups">
          <Card>
            <CardHeader>
              <CardTitle>Trainingsgruppen ({session.groups.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {session.groups.map((sessionGroup: any) => (
                  <div key={sessionGroup.id} className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">{sessionGroup.trainingGroup.name}</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        Trainer:{' '}
                        {sessionGroup.trainerAssignments
                          .map(
                            (a: any) => `${a.trainer.firstName} ${a.trainer.lastName}`
                          )
                          .join(', ')}
                      </p>
                      <p>
                        Athleten: {sessionGroup.trainingGroup.athleteAssignments?.length || 0}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="athletes">
          <Card>
            <CardHeader>
              <CardTitle>
                <Users className="h-5 w-5 inline mr-2" />
                Athleten ({allAthletes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {athletes.map((group) => (
                <div key={group.sessionGroup.id} className="mb-6 last:mb-0">
                  <h4 className="font-medium mb-3">{group.sessionGroup.trainingGroup.name}</h4>
                  <div className="space-y-2">
                    {group.athletes.map((athlete: any) => (
                      <div
                        key={athlete.athlete.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <span>
                          {athlete.athlete.firstName} {athlete.athlete.lastName}
                        </span>
                        <div className="flex items-center space-x-2">
                          {athlete.isCancelled && <Badge variant="warning">Abgesagt</Badge>}
                          {athlete.attendance && (
                            <Badge
                              variant={
                                athlete.attendance.status === 'PRESENT'
                                  ? 'success'
                                  : athlete.attendance.status === 'ABSENT_EXCUSED'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {athlete.attendance.status === 'PRESENT'
                                ? 'Anwesend'
                                : athlete.attendance.status === 'ABSENT_EXCUSED'
                                ? 'Entschuldigt'
                                : 'Unentschuldigt'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Exercise Editor Dialog */}
      <Dialog open={showExerciseEditor} onOpenChange={setShowExerciseEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Übungen bearbeiten</DialogTitle>
          </DialogHeader>
          <SessionEditor
            sessionId={sessionId}
            sessionGroups={session.groups}
            onSave={handleSaveExercises}
            onCopyFromPrevious={handleCopyFromPrevious}
          />
        </DialogContent>
      </Dialog>

      {/* Attendance Marker Dialog */}
      <Dialog open={showAttendanceMarker} onOpenChange={setShowAttendanceMarker}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Anwesenheit markieren</DialogTitle>
          </DialogHeader>
          <AttendanceMarker
            sessionId={sessionId}
            sessionName={session.recurringTraining?.name || 'Training'}
            sessionDate={formatDate(session.date)}
            athletes={allAthletes.map((a: any) => ({
              id: a.athlete.id,
              firstName: a.athlete.firstName,
              lastName: a.athlete.lastName,
              isCancelled: a.isCancelled,
              currentAttendance: a.attendance,
            }))}
            onSave={handleSaveAttendance}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}