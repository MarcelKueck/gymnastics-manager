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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Willkommen zurück!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle>Nächstes Training</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {stats.nextSession.recurringTraining?.name || 'Training'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formatDate(stats.nextSession.date)} - {stats.nextSession.startTime} bis{' '}
                  {stats.nextSession.endTime}
                </p>
              </div>
              {stats.nextSession.cancellations?.length > 0 ? (
                <Badge variant="warning">Abgesagt</Badge>
              ) : (
                <Link href="/athlete/schedule">
                  <Button variant="outline" size="sm">
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
          <CardTitle>Letzte Trainings</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentAttendance.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Trainings absolviert</p>
          ) : (
            <div className="space-y-3">
              {stats.recentAttendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {record.trainingSession.recurringTraining?.name || 'Training'}
                    </p>
                    <p className="text-sm text-muted-foreground">
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