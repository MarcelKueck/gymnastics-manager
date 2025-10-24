'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ATTENDANCE_STATUS_LABELS } from '@/lib/constants/statuses';

export function AthleteAttendanceContent() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await fetch('/api/athlete/attendance');
      if (!response.ok) throw new Error('Fehler beim Laden der Anwesenheit');

      const data = await response.json();
      setAttendance(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'success';
      case 'ABSENT_EXCUSED':
        return 'secondary';
      case 'ABSENT_UNEXCUSED':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Anwesenheit</h1>
        <p className="text-muted-foreground">Deine Anwesenheitshistorie</p>
      </div>

      {attendance.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            Noch keine Anwesenheitsdaten vorhanden
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Anwesenheitshistorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">
                      {record.trainingSession.recurringTraining?.name || 'Training'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(record.trainingSession.date)} -{' '}
                      {record.trainingSession.startTime} bis {record.trainingSession.endTime}
                    </p>
                    {record.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Notiz: {record.notes}
                      </p>
                    )}
                  </div>
                  <Badge variant={getStatusBadgeVariant(record.status)}>
                    {ATTENDANCE_STATUS_LABELS[record.status as keyof typeof ATTENDANCE_STATUS_LABELS]}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}