'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface AttendanceRecord {
  id: string;
  status: string;
  markedAt: string;
  notes: string | null;
  cancellationReason: string | null;
  trainingSession: {
    date: string;
    dayOfWeek: string;
    startTime: string | null;
    endTime: string | null;
    groupName: string | null;
    trainingName: string | null;
  };
}

interface Statistics {
  totalSessions: number;
  presentSessions: number;
  excusedAbsences: number;
  unexcusedAbsences: number;
  attendancePercentage: number;
  excusedPercentage: number;
}

const dayTranslations: Record<string, string> = {
  MONDAY: 'Montag',
  THURSDAY: 'Donnerstag',
  FRIDAY: 'Freitag',
};

const statusTranslations: Record<string, string> = {
  PRESENT: 'Anwesend',
  ABSENT_EXCUSED: 'Entschuldigt',
  ABSENT_UNEXCUSED: 'Unentschuldigt',
};

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  PRESENT: CheckCircle,
  ABSENT_EXCUSED: AlertCircle,
  ABSENT_UNEXCUSED: XCircle,
};

const statusColors: Record<string, string> = {
  PRESENT: 'text-green-600 bg-green-50',
  ABSENT_EXCUSED: 'text-yellow-600 bg-yellow-50',
  ABSENT_UNEXCUSED: 'text-red-600 bg-red-50',
};

export default function AthleteAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/athlete/attendance');
      if (!response.ok) throw new Error('Failed to load attendance');
      const data = await response.json();
      setRecords(data.records);
      setStatistics(data.stats);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Fehler beim Laden der Anwesenheit');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Anwesenheitsdaten...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!statistics) {
    return <Alert variant="default">Keine Anwesenheitsdaten verfügbar</Alert>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Anwesenheit</h1>
        <p className="text-sm text-gray-600 mt-1">Deine komplette Trainingshistorie</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Gesamt Trainings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{statistics.totalSessions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Anwesend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{statistics.presentSessions}</p>
            <p className="text-xs text-gray-500 mt-1">
              {statistics.attendancePercentage}% Anwesenheit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Entschuldigt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{statistics.excusedAbsences}</p>
            <p className="text-xs text-gray-500 mt-1">
              {statistics.excusedPercentage}% entschuldigt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Unentschuldigt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {statistics.unexcusedAbsences}
            </p>
            {statistics.unexcusedAbsences >= 3 && (
              <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Warnung</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alert for multiple unexcused absences */}
      {statistics.unexcusedAbsences >= 3 && (
        <Alert variant="warning">
          <p className="font-medium">
            Du hast {statistics.unexcusedAbsences} unentschuldigte Fehlzeiten.
          </p>
          <p className="text-sm mt-1">
            Bitte sage zukünftige Trainings rechtzeitig ab oder kontaktiere deinen Trainer.
          </p>
        </Alert>
      )}

      {/* Attendance History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trainingshistorie</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <Alert variant="default">Noch keine Anwesenheitsdaten vorhanden</Alert>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Datum</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Tag</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Training</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Gruppe</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => {
                    const Icon = statusIcons[record.status];
                    return (
                      <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">
                          {format(new Date(record.trainingSession.date), 'dd.MM.yyyy', {
                            locale: de,
                          })}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {dayTranslations[record.trainingSession.dayOfWeek]}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {record.trainingSession.trainingName || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {record.trainingSession.groupName || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              statusColors[record.status]
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {statusTranslations[record.status]}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {record.cancellationReason && (
                            <div className="max-w-xs">
                              <span className="font-medium">Grund: </span>
                              {record.cancellationReason}
                            </div>
                          )}
                          {record.notes && (
                            <div className="max-w-xs text-gray-500">
                              <span className="font-medium">Notiz: </span>
                              {record.notes}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}