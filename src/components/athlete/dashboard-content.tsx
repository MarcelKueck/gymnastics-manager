'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface DashboardStats {
  nextSession: any;
  upcomingSessions: number;
  recentAttendance: any[];
  activeCancellations: number;
  monthlyAttendanceRate: number;
  monthlyTotal: number;
  monthlyPresent: number;
}

export function AthleteDashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/athlete/dashboard');
      if (!response.ok) throw new Error('Fehler beim Laden der Daten');

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
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">Willkommen zurück!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Nächstes Training"
          value={stats.upcomingSessions}
          description="Diese Woche"
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          title="Anwesenheit"
          value={`${stats.monthlyAttendanceRate}%`}
          description="Diesen Monat"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title="Trainings absolviert"
          value={stats.monthlyPresent}
          description={`Von ${stats.monthlyTotal} gesamt`}
        />
        {stats.activeCancellations > 0 && (
          <StatCard
            title="Aktive Absagen"
            value={stats.activeCancellations}
            description="Für kommende Trainings"
            icon={<AlertCircle className="h-4 w-4" />}
          />
        )}
      </div>

      {/* Next Session */}
      {stats.nextSession && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Nächstes Training</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-semibold truncate">
                  {stats.nextSession.recurringTraining?.name || 'Training'}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {formatDate(stats.nextSession.date)} - {stats.nextSession.startTime} bis{' '}
                  {stats.nextSession.endTime}
                </p>
              </div>
              {stats.nextSession.cancellations?.length > 0 ? (
                <Badge variant="warning">Abgesagt</Badge>
              ) : (
                <Link href="/athlete/schedule" className="flex-shrink-0">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    Details anzeigen
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Letzte Trainings</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentAttendance.length === 0 ? (
            <p className="text-xs md:text-sm text-muted-foreground">Noch keine Trainings absolviert</p>
          ) : (
            <div className="space-y-3">
              {stats.recentAttendance.map((record) => (
                <div
                  key={record.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 border-b pb-3 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm md:text-base truncate">
                      {record.trainingSession.recurringTraining?.name || 'Training'}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {formatDate(record.trainingSession.date)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      record.status === 'PRESENT'
                        ? 'success'
                        : record.status === 'ABSENT_EXCUSED'
                        ? 'secondary'
                        : 'destructive'
                    }
                    className="self-start sm:self-auto"
                  >
                    {record.status === 'PRESENT'
                      ? 'Anwesend'
                      : record.status === 'ABSENT_EXCUSED'
                      ? 'Entschuldigt'
                      : 'Unentschuldigt'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}