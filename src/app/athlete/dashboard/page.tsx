'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Calendar, Percent, Ban, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface DashboardData {
  upcomingSessions: {
    id: string;
    date: string;
    name: string;
    startTime: string;
    endTime: string;
    isCancelled: boolean;
  }[];
  monthlyStats: {
    totalSessions: number;
    presentCount: number;
    attendanceRate: number;
  };
  activeCancellations: number;
}

export default function AthleteDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/athlete/dashboard')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((result) => setData(result.data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <Loading />;
  if (error) return <div className="text-destructive">Fehler beim Laden: {error}</div>;
  if (!data) return <div>Keine Daten verfügbar</div>;

  const nextSession = data.upcomingSessions[0];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Anwesenheitsrate
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.monthlyStats.attendanceRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data.monthlyStats.presentCount} von {data.monthlyStats.totalSessions} diesen Monat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Nächstes Training
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {nextSession ? (
              <>
                <div className="text-2xl font-bold">
                  {formatDate(nextSession.date)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {nextSession.name}
                </p>
              </>
            ) : (
              <div className="text-muted-foreground">
                Keine anstehenden Trainings
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Aktive Absagen
            </CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.activeCancellations}
            </div>
            <Link href="/athlete/schedule">
              <Button variant="link" className="p-0 h-auto text-xs">
                Verwalten →
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Link href="/athlete/schedule">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Trainings anzeigen
          </Button>
        </Link>
      </div>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Anstehende Trainings</CardTitle>
        </CardHeader>
        <CardContent>
          {data.upcomingSessions.length === 0 ? (
            <p className="text-muted-foreground">
              Keine anstehenden Trainings
            </p>
          ) : (
            <div className="space-y-4">
              {data.upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-muted rounded-md">
                      <span className="text-xs text-muted-foreground">
                        {new Date(session.date).toLocaleDateString('de-DE', { weekday: 'short' })}
                      </span>
                      <span className="font-bold">
                        {new Date(session.date).getDate()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{session.name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {session.startTime} - {session.endTime}
                      </p>
                    </div>
                  </div>
                  {session.isCancelled && (
                    <Badge variant="secondary">Abgesagt</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
          {data.upcomingSessions.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <Link href="/athlete/schedule">
                <Button variant="ghost" className="w-full">
                  Alle Trainings anzeigen →
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
