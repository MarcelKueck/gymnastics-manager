'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { 
  Calendar, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  UserPlus,
  ClipboardList,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface DashboardData {
  upcomingSessions: {
    id: string;
    date: string;
    name: string;
    startTime: string;
    endTime: string;
    groups: string[];
    attendanceMarked: boolean;
  }[];
  pendingApprovals: number;
  athletesNeedingAttention: {
    id: string;
    name: string;
    absenceCount: number;
    alertDate: string;
  }[];
  stats: {
    sessionsThisWeek: number;
    attendanceMarkedThisWeek: number;
  };
}

export default function TrainerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/trainer/dashboard')
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trainer Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/trainer/sessions">
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Trainings verwalten
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Trainings diese Woche
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.sessionsThisWeek}</div>
            <p className="text-xs text-muted-foreground">abgeschlossen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Anwesenheit erfasst
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.attendanceMarkedThisWeek}</div>
            <p className="text-xs text-muted-foreground">diese Woche</p>
          </CardContent>
        </Card>

        <Card className={data.pendingApprovals > 0 ? 'border-yellow-500' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Ausstehende Freigaben
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingApprovals}</div>
            {data.pendingApprovals > 0 && (
              <Link href="/trainer/athletes?status=pending">
                <Button variant="link" className="p-0 h-auto text-xs">
                  Jetzt prüfen →
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        <Card className={data.athletesNeedingAttention.length > 0 ? 'border-orange-500' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Fehlzeiten-Warnungen
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.athletesNeedingAttention.length}</div>
            <p className="text-xs text-muted-foreground">Athleten mit häufigen Fehlzeiten</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Link href="/trainer/sessions">
          <Button variant="outline">
            <ClipboardList className="h-4 w-4 mr-2" />
            Anwesenheit erfassen
          </Button>
        </Link>
        <Link href="/trainer/athletes">
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Athleten verwalten
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Anstehende Trainings</CardTitle>
            <CardDescription>Diese Woche</CardDescription>
          </CardHeader>
          <CardContent>
            {data.upcomingSessions.length === 0 ? (
              <p className="text-muted-foreground">Keine anstehenden Trainings</p>
            ) : (
              <div className="space-y-4">
                {data.upcomingSessions.slice(0, 5).map((session) => (
                  <Link
                    key={session.id}
                    href={`/trainer/sessions/${session.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                      <div className="flex items-center gap-3">
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
                          <p className="text-sm text-muted-foreground">
                            {session.startTime} - {session.endTime}
                          </p>
                          <div className="flex gap-1 mt-1">
                            {session.groups.map((group) => (
                              <Badge key={group} variant="secondary" className="text-xs">
                                {group}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      {session.attendanceMarked ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {data.upcomingSessions.length > 5 && (
              <div className="mt-4 pt-4 border-t">
                <Link href="/trainer/sessions">
                  <Button variant="ghost" className="w-full">
                    Alle anzeigen →
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Athletes needing attention */}
        <Card>
          <CardHeader>
            <CardTitle>Fehlzeiten-Warnungen</CardTitle>
            <CardDescription>Athleten mit häufigen Abwesenheiten</CardDescription>
          </CardHeader>
          <CardContent>
            {data.athletesNeedingAttention.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-muted-foreground">Keine Warnungen vorhanden</p>
                <p className="text-xs text-muted-foreground">Alle Athleten haben gute Anwesenheit</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.athletesNeedingAttention.map((athlete) => (
                  <Link
                    key={athlete.id}
                    href={`/trainer/athletes/${athlete.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                      <div>
                        <p className="font-medium">{athlete.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Warnung vom {formatDate(athlete.alertDate)}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        {athlete.absenceCount}x gefehlt
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
