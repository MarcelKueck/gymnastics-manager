'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { StatCard } from '@/components/ui/stat-card';
import { BarChart3, Calendar, XCircle, TrendingUp, FileText, Clock, Award } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface AthleteStatistics {
  currentYear: {
    sessionsAttended: number;
    cancellations: number;
    attendanceRate: number;
    totalSessions: number;
  };
  allTime: {
    totalSessions: number;
    totalCancellations: number;
  };
  nextSession: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    dayOfWeek: string;
    groupName: string | null;
    trainingName: string | null;
  } | null;
  uploadsCount: number;
  recentAttendance: Array<{
    date: string;
    status: string;
    sessionInfo: string;
  }>;
}

const statusTranslations: Record<string, string> = {
  PRESENT: 'Anwesend',
  ABSENT_EXCUSED: 'Entschuldigt',
  ABSENT_UNEXCUSED: 'Unentschuldigt',
};

export default function AthleteStatisticsPage() {
  const [statistics, setStatistics] = useState<AthleteStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/athlete/statistics');
      if (!response.ok) throw new Error('Failed to load statistics');
      const data = await response.json();
      setStatistics(data);
    } catch (err) {
      setError('Fehler beim Laden der Statistiken');
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
          <p className="mt-4 text-gray-600">Lade Statistiken...</p>
        </div>
      </div>
    );
  }

  if (error || !statistics) {
    return <Alert variant="error">{error || 'Statistiken nicht verfügbar'}</Alert>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meine Statistiken</h1>
        <p className="text-gray-600 mt-1">Deine Trainingsaktivitäten und Fortschritte</p>
      </div>

      {/* Current Year Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Dieses Jahr ({new Date().getFullYear()})
          </CardTitle>
          <CardDescription>Deine Aktivitäten im laufenden Jahr</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Trainingseinheiten"
              value={statistics.currentYear.sessionsAttended}
              icon={Calendar}
              color="green"
              subtitle="Anwesenheit"
            />
            <StatCard
              title="Abwesenheiten"
              value={statistics.currentYear.cancellations}
              icon={XCircle}
              color="red"
              subtitle="Abgesagt"
            />
            <StatCard
              title="Anwesenheitsrate"
              value={`${statistics.currentYear.attendanceRate}%`}
              icon={TrendingUp}
              color="blue"
              subtitle={`von ${statistics.currentYear.totalSessions} Einheiten`}
            />
            <StatCard
              title="Verfügbare Dokumente"
              value={statistics.uploadsCount}
              icon={FileText}
              color="purple"
              subtitle="Trainingspläne & mehr"
            />
          </div>
        </CardContent>
      </Card>

      {/* All Time Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Gesamtstatistik
          </CardTitle>
          <CardDescription>Deine Aktivitäten seit Beginn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="Gesamt Trainingseinheiten"
              value={statistics.allTime.totalSessions}
              icon={Calendar}
              color="teal"
              subtitle="Insgesamt besucht"
            />
            <StatCard
              title="Gesamt Abwesenheiten"
              value={statistics.allTime.totalCancellations}
              icon={XCircle}
              color="orange"
              subtitle="Insgesamt abgesagt"
            />
          </div>
        </CardContent>
      </Card>

      {/* Next Session */}
      {statistics.nextSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Nächste Trainingseinheit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-6 border border-teal-200">
              <div className="flex items-start gap-4">
                <div className="bg-teal-500 rounded-full p-4">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {format(new Date(statistics.nextSession.date), 'EEEE, dd. MMMM yyyy', { locale: de })}
                  </h3>
                  <div className="space-y-1 text-gray-700">
                    <p className="font-medium">
                      Uhrzeit: {statistics.nextSession.startTime} - {statistics.nextSession.endTime} Uhr
                    </p>
                    {statistics.nextSession.trainingName && (
                      <p>
                        Training: {statistics.nextSession.trainingName}
                      </p>
                    )}
                    {statistics.nextSession.groupName && (
                      <p>
                        Gruppe: {statistics.nextSession.groupName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Attendance */}
      {statistics.recentAttendance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Letzte Anwesenheiten
            </CardTitle>
            <CardDescription>Deine letzten 10 Trainingseinheiten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statistics.recentAttendance.map((record, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {format(new Date(record.date), 'dd.MM.yyyy', { locale: de })}
                    </p>
                    <p className="text-xs text-gray-600">{record.sessionInfo}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      record.status === 'PRESENT'
                        ? 'bg-green-100 text-green-800'
                        : record.status === 'ABSENT_EXCUSED'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {statusTranslations[record.status]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
