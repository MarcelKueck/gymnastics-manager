'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, Calendar, CheckCircle, XCircle } from 'lucide-react';

export function AthleteStatisticsContent() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/athlete/statistics');
      if (!response.ok) throw new Error('Fehler beim Laden der Statistiken');

      const data = await response.json();
      setStats(data.data);
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

  if (!stats) return null;

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Statistiken</h1>
        <p className="text-sm md:text-base text-muted-foreground">Deine Trainingsstatistiken</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Gesamt Trainings"
          value={stats.totalSessions}
          description="Alle Zeit"
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          title="Anwesend"
          value={stats.present}
          description={`${stats.attendanceRate}% Anwesenheitsrate`}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <StatCard
          title="Entschuldigt"
          value={stats.excused}
          description="Entschuldigte Fehlzeiten"
          icon={<AlertCircle className="h-4 w-4" />}
        />
        <StatCard
          title="Unentschuldigt"
          value={stats.unexcused}
          description="Unentschuldigte Fehlzeiten"
          icon={<XCircle className="h-4 w-4" />}
        />
      </div>

      {/* Attendance Rate Card */}
      <Card>
        <CardHeader>
          <CardTitle>Anwesenheitsrate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Gesamt</span>
              <span className="text-2xl font-bold text-primary">{stats.attendanceRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-primary h-4 rounded-full transition-all"
                style={{ width: `${stats.attendanceRate}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Anwesend</p>
                <p className="font-medium text-green-600">{stats.present}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Entschuldigt</p>
                <p className="font-medium text-yellow-600">{stats.excused}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Unentschuldigt</p>
                <p className="font-medium text-red-600">{stats.unexcused}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}