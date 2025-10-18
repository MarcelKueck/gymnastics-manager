'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { ArrowLeft, Calendar, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface AttendanceRecord {
  id: string;
  date: string;
  dayOfWeek: string;
  hourNumber: number;
  groupNumber: number;
  status: 'PRESENT' | 'ABSENT_UNEXCUSED' | 'ABSENT_EXCUSED';
  cancellationReason?: string;
  markedBy: string;
  markedAt: string;
  lastModifiedBy?: string;
  lastModifiedAt?: string;
}

interface AthleteInfo {
  firstName: string;
  lastName: string;
}

const dayTranslations: Record<string, string> = {
  MONDAY: 'Montag',
  THURSDAY: 'Donnerstag',
  FRIDAY: 'Freitag',
};

export default function AthleteAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const athleteId = params.id as string;

  const [athlete, setAthlete] = useState<AthleteInfo | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAttendanceHistory();
  }, [athleteId]);

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/trainer/athletes/${athleteId}/attendance`);
      if (!response.ok) throw new Error('Failed to fetch attendance history');
      const data = await response.json();
      setAthlete(data.athlete);
      setRecords(data.records);
    } catch (err) {
      setError('Fehler beim Laden der Anwesenheitshistorie');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Anwesend
          </span>
        );
      case 'ABSENT_EXCUSED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <MinusCircle className="h-3 w-3 mr-1" />
            Entschuldigt
          </span>
        );
      case 'ABSENT_UNEXCUSED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Unentschuldigt
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error || !athlete) {
    return (
      <div className="space-y-4">
        <Alert variant="error">{error || 'Daten nicht gefunden'}</Alert>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={() => router.back()} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Anwesenheitshistorie: {athlete.firstName} {athlete.lastName}
          </h1>
          <p className="text-gray-600 mt-1">{records.length} Trainingseinheiten</p>
        </div>
      </div>

      {/* Attendance Records */}
      {records.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Keine Anwesenheitsdaten
          </h3>
          <p className="text-gray-600">
            Es wurden noch keine Trainingseinheiten erfasst.
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Alle Trainingseinheiten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Datum
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tag
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Zeit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Gruppe
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Grund
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {format(new Date(record.date), 'dd.MM.yyyy', { locale: de })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {dayTranslations[record.dayOfWeek]}
                      </td>
                      <td className="px-4 py-3 text-sm">{record.hourNumber}. Stunde</td>
                      <td className="px-4 py-3 text-sm">Gruppe {record.groupNumber}</td>
                      <td className="px-4 py-3">{getStatusBadge(record.status)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {record.cancellationReason || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}