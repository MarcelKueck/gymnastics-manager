'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, XCircle, MinusCircle, Save } from 'lucide-react';
import { AttendanceStatus } from '@prisma/client';
import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUS_COLORS } from '@/lib/constants/statuses';

interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  isCancelled?: boolean;
  currentAttendance?: {
    status: AttendanceStatus;
    notes?: string;
  };
}

interface AttendanceMarkerProps {
  sessionId: string;
  sessionName: string;
  sessionDate: string;
  athletes: Athlete[];
  onSave: (
    records: Array<{ athleteId: string; status: AttendanceStatus; notes?: string }>
  ) => Promise<void>;
}

export function AttendanceMarker({
  sessionId,
  sessionName,
  sessionDate,
  athletes,
  onSave,
}: AttendanceMarkerProps) {
  const [attendance, setAttendance] = useState<
    Record<string, { status: AttendanceStatus | null; notes: string }>
  >(
    athletes.reduce((acc, athlete) => {
      acc[athlete.id] = {
        status: athlete.currentAttendance?.status || null,
        notes: athlete.currentAttendance?.notes || '',
      };
      return acc;
    }, {} as Record<string, { status: AttendanceStatus | null; notes: string }>)
  );
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const setStatus = (athleteId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [athleteId]: {
        ...prev[athleteId],
        status,
      },
    }));
  };

  const handleSave = async () => {
    setError('');

    // Check if all athletes have attendance marked
    const unmarked = athletes.filter((a) => !a.isCancelled && !attendance[a.id]?.status);
    if (unmarked.length > 0) {
      setError(`Bitte markiere die Anwesenheit für alle Athleten (${unmarked.length} fehlen noch)`);
      return;
    }

    setIsLoading(true);
    try {
      const records = athletes
        .filter((a) => !a.isCancelled && attendance[a.id]?.status)
        .map((a) => ({
          athleteId: a.id,
          status: attendance[a.id].status!,
          notes: attendance[a.id].notes,
        }));

      await onSave(records);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusButton = (
    athleteId: string,
    status: AttendanceStatus,
    icon: React.ReactNode,
    label: string,
    variant: 'default' | 'destructive' | 'outline' | 'secondary'
  ) => {
    const isSelected = attendance[athleteId]?.status === status;
    return (
      <Button
        type="button"
        variant={isSelected ? variant : 'outline'}
        size="sm"
        onClick={() => setStatus(athleteId, status)}
        className="flex-1"
      >
        {icon}
        <span className="ml-1 hidden sm:inline">{label}</span>
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">{sessionName}</h3>
        <p className="text-sm text-muted-foreground">
          {new Date(sessionDate).toLocaleDateString('de-DE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {athletes.map((athlete) => (
          <Card key={athlete.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      {athlete.firstName} {athlete.lastName}
                    </span>
                    {athlete.isCancelled && <Badge variant="warning">Abgesagt</Badge>}
                  </div>
                </div>

                {!athlete.isCancelled && (
                  <div className="flex space-x-2">
                    {getStatusButton(
                      athlete.id,
                      AttendanceStatus.PRESENT,
                      <CheckCircle className="h-4 w-4" />,
                      'Anwesend',
                      'default'
                    )}
                    {getStatusButton(
                      athlete.id,
                      AttendanceStatus.ABSENT_EXCUSED,
                      <MinusCircle className="h-4 w-4" />,
                      'Entschuldigt',
                      'secondary'
                    )}
                    {getStatusButton(
                      athlete.id,
                      AttendanceStatus.ABSENT_UNEXCUSED,
                      <XCircle className="h-4 w-4" />,
                      'Unentschuldigt',
                      'destructive'
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {athletes.filter((a) => !a.isCancelled && attendance[a.id]?.status).length} von{' '}
          {athletes.filter((a) => !a.isCancelled).length} markiert
        </p>
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Speichere...' : 'Anwesenheit speichern'}
        </Button>
      </div>
    </div>
  );
}