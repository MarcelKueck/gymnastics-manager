'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { StatCard } from '@/components/ui/stat-card';
import { BarChart3, Calendar, Users, Repeat, FileText, TrendingUp, Award, CheckCircle } from 'lucide-react';

interface TrainerStatistics {
  currentYear: {
    sessionsConducted: number;
    attendanceMarked: number;
  };
  allTime: {
    totalApprovedAthletes: number;
    totalSessions: number;
    totalUploads: number;
  };
  current: {
    athletesInGroups: number;
    recurringTrainingAssignments: number;
    activeUploads: number;
  };
  topAthletes: Array<{
    id: string;
    name: string;
    attendanceRate: number;
    sessionsAttended: number;
  }>;
}

export default function TrainerStatisticsPage() {
  const [statistics, setStatistics] = useState<TrainerStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trainer/statistics');
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
        <h1 className="text-2xl font-bold text-gray-900">Trainer Statistiken</h1>
        <p className="text-gray-600 mt-1">Übersicht über Ihre Trainingsaktivitäten</p>
      </div>

      {/* Current Year Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Dieses Jahr ({new Date().getFullYear()})
          </CardTitle>
          <CardDescription>Ihre Aktivitäten im laufenden Jahr</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="Trainingseinheiten"
              value={statistics.currentYear.sessionsConducted}
              icon={Calendar}
              color="green"
              subtitle="Durchgeführte Sessions"
            />
            <StatCard
              title="Anwesenheiten markiert"
              value={statistics.currentYear.attendanceMarked}
              icon={CheckCircle}
              color="blue"
              subtitle="Erfasste Teilnahmen"
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Aktuelle Situation
          </CardTitle>
          <CardDescription>Ihr aktueller Status im System</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Athleten in Gruppen"
              value={statistics.current.athletesInGroups}
              icon={Users}
              color="teal"
              subtitle="Aktuell zugewiesen"
            />
            <StatCard
              title="Wiederkehrende Trainings"
              value={statistics.current.recurringTrainingAssignments}
              icon={Repeat}
              color="orange"
              subtitle="Zugewiesene Gruppen"
            />
            <StatCard
              title="Aktive Dokumente"
              value={statistics.current.activeUploads}
              icon={FileText}
              color="purple"
              subtitle="Hochgeladene Dateien"
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
          <CardDescription>Ihre Aktivitäten seit Beginn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Freigegebene Athleten"
              value={statistics.allTime.totalApprovedAthletes}
              icon={Users}
              color="blue"
              subtitle="Insgesamt betreut"
            />
            <StatCard
              title="Gesamt Trainingseinheiten"
              value={statistics.allTime.totalSessions}
              icon={Calendar}
              color="green"
              subtitle="Insgesamt durchgeführt"
            />
            <StatCard
              title="Gesamt Uploads"
              value={statistics.allTime.totalUploads}
              icon={FileText}
              color="purple"
              subtitle="Insgesamt hochgeladen"
            />
          </div>
        </CardContent>
      </Card>

      {/* Top Athletes */}
      {statistics.topAthletes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Beste Anwesenheit
            </CardTitle>
            <CardDescription>Athleten mit der höchsten Anwesenheitsrate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statistics.topAthletes.map((athlete, index) => (
                <div
                  key={athlete.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{athlete.name}</p>
                      <p className="text-sm text-gray-600">
                        {athlete.sessionsAttended} Trainingseinheiten besucht
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-teal-600">{athlete.attendanceRate}%</p>
                    <p className="text-xs text-gray-500">Anwesenheitsrate</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}