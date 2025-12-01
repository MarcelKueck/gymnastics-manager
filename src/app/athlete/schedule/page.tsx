'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/shared/empty-state';
import { Calendar, Clock, CheckCircle, XCircle, Ban } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ScheduleSession {
  id: string;
  date: string;
  name: string;
  startTime: string;
  endTime: string;
  isCancelled: boolean;
  cancellationReason?: string;
  athleteCancelled: boolean;
  athleteCancellationReason?: string;
  isCompleted: boolean;
  attendanceStatus?: 'PRESENT' | 'ABSENT_UNEXCUSED' | 'ABSENT_EXCUSED';
}

type ViewMode = 'list' | 'week';

export default function AthleteSchedule() {
  const [sessions, setSessions] = useState<ScheduleSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    fetch('/api/athlete/schedule?weeks=4')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((result) => setSessions(result.data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <Loading />;
  if (error) return <div className="text-destructive">Fehler beim Laden: {error}</div>;

  const getStatusBadge = (session: ScheduleSession) => {
    if (session.isCancelled) {
      return <Badge variant="destructive">Training abgesagt</Badge>;
    }
    if (session.athleteCancelled) {
      return <Badge variant="secondary">Abgemeldet</Badge>;
    }
    if (session.isCompleted) {
      switch (session.attendanceStatus) {
        case 'PRESENT':
          return <Badge className="bg-green-500">Anwesend</Badge>;
        case 'ABSENT_UNEXCUSED':
          return <Badge variant="destructive">Abwesend</Badge>;
        case 'ABSENT_EXCUSED':
          return <Badge variant="secondary">Entschuldigt</Badge>;
        default:
          return <Badge variant="outline">Abgeschlossen</Badge>;
      }
    }
    return null;
  };

  const getStatusIcon = (session: ScheduleSession) => {
    if (session.isCancelled) {
      return <XCircle className="h-5 w-5 text-destructive" />;
    }
    if (session.athleteCancelled) {
      return <Ban className="h-5 w-5 text-muted-foreground" />;
    }
    if (session.isCompleted && session.attendanceStatus === 'PRESENT') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (session.isCompleted && (session.attendanceStatus === 'ABSENT_UNEXCUSED' || session.attendanceStatus === 'ABSENT_EXCUSED')) {
      return <XCircle className="h-5 w-5 text-destructive" />;
    }
    return <Calendar className="h-5 w-5 text-primary" />;
  };

  // Group sessions by week for week view
  const groupByWeek = (sessions: ScheduleSession[]) => {
    const weeks: { [key: string]: ScheduleSession[] } = {};
    sessions.forEach((session) => {
      const date = new Date(session.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1); // Monday
      const key = weekStart.toISOString().split('T')[0];
      if (!weeks[key]) weeks[key] = [];
      weeks[key].push(session);
    });
    return weeks;
  };

  const weekGroups = groupByWeek(sessions);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trainingsplan</h1>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            Liste
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            Wochenansicht
          </Button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-10 w-10" />}
          title="Keine Trainings gefunden"
          description="Du bist noch keiner Trainingsgruppe zugewiesen."
        />
      ) : viewMode === 'list' ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border',
                    session.isCancelled && 'bg-destructive/5 border-destructive/20',
                    session.athleteCancelled && 'bg-muted/50',
                    !session.isCancelled && !session.athleteCancelled && !session.isCompleted && 'bg-card'
                  )}
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(session)}
                    <div>
                      <p className="font-medium">{session.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(session.date)} • {session.startTime} - {session.endTime}
                      </p>
                      {session.athleteCancelled && session.athleteCancellationReason && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Grund: {session.athleteCancellationReason}
                        </p>
                      )}
                      {session.isCancelled && session.cancellationReason && (
                        <p className="text-xs text-destructive mt-1">
                          {session.cancellationReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(session)}
                    {!session.isCancelled && !session.athleteCancelled && !session.isCompleted && (
                      <Link href={`/athlete/cancellations?session=${session.id}`}>
                        <Button variant="outline" size="sm">
                          Absagen
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(weekGroups).map(([weekStart, weekSessions]) => (
            <Card key={weekStart}>
              <CardHeader>
                <CardTitle className="text-lg">
                  Woche vom {formatDate(weekStart)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {weekSessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-md',
                        session.isCancelled && 'bg-destructive/10',
                        session.athleteCancelled && 'bg-muted',
                        !session.isCancelled && !session.athleteCancelled && 'bg-accent/50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-center min-w-[60px]">
                          <div className="text-xs text-muted-foreground">
                            {new Date(session.date).toLocaleDateString('de-DE', { weekday: 'short' })}
                          </div>
                          <div className="font-bold">
                            {new Date(session.date).getDate()}.{new Date(session.date).getMonth() + 1}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{session.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {session.startTime} - {session.endTime}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(session)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
