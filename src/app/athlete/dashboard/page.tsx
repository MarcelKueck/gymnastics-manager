'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { 
  Calendar, 
  Percent, 
  Ban, 
  Clock, 
  Trophy, 
  FileText, 
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Users,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { format, isBefore, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

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
  upcomingCompetitions: {
    id: string;
    name: string;
    date: string;
    location: string | null;
    registrationDeadline: string | null;
    isRegistered: boolean;
  }[];
  recentFiles: {
    id: string;
    title: string;
    category: string;
    uploadedAt: string;
  }[];
  trainingGroups: {
    id: string;
    name: string;
    trainingName: string;
  }[];
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
  if (error) return (
    <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">
      Fehler beim Laden: {error}
    </div>
  );
  if (!data) return (
    <div className="text-muted-foreground p-4">Keine Daten verfügbar</div>
  );

  const nextSession = data.upcomingSessions[0];
  const today = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold sm:text-2xl">Dashboard</h1>
        {data.trainingGroups && data.trainingGroups.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.trainingGroups.map((group) => (
              <Badge key={group.id} variant="secondary" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {group.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Anwesenheitsrate
            </CardTitle>
            <Percent className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.monthlyStats.attendanceRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.monthlyStats.presentCount} von {data.monthlyStats.totalSessions} diesen Monat
            </p>
          </CardContent>
        </Card>

        <Card className={nextSession ? '' : 'border-dashed'}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nächstes Training
            </CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {nextSession ? (
              <>
                <div className="text-2xl font-bold">
                  {format(parseISO(nextSession.date), 'EEEE', { locale: de })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(nextSession.date)} • {nextSession.startTime}
                </p>
              </>
            ) : (
              <div className="text-muted-foreground text-sm">
                Keine anstehenden Trainings
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={data.activeCancellations > 0 ? 'border-amber-500' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktive Absagen
            </CardTitle>
            <Ban className="h-5 w-5 text-muted-foreground" />
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
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Trainings anzeigen
          </Button>
        </Link>
        <Link href="/athlete/competitions">
          <Button variant="outline">
            <Trophy className="h-4 w-4 mr-2" />
            Wettkämpfe
          </Button>
        </Link>
        <Link href="/athlete/files">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Dateien
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Anstehende Trainings
              <Link href="/athlete/schedule">
                <Button variant="ghost" size="sm" className="h-8">
                  Alle <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.upcomingSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-sm">
                  Keine anstehenden Trainings
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center justify-center w-12 h-12 bg-primary/10 text-primary rounded-lg shrink-0">
                        <span className="text-xs font-medium">
                          {format(parseISO(session.date), 'EEE', { locale: de })}
                        </span>
                        <span className="font-bold">
                          {new Date(session.date).getDate()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{session.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {session.startTime} - {session.endTime}
                        </p>
                      </div>
                    </div>
                    {session.isCancelled && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        Abgesagt
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Competitions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Anstehende Wettkämpfe
              <Link href="/athlete/competitions">
                <Button variant="ghost" size="sm" className="h-8">
                  Alle <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!data.upcomingCompetitions || data.upcomingCompetitions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-sm">
                  Keine anstehenden Wettkämpfe
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.upcomingCompetitions.map((competition) => {
                  const isDeadlinePassed = competition.registrationDeadline && 
                    isBefore(parseISO(competition.registrationDeadline), today);
                  const isDeadlineSoon = competition.registrationDeadline && 
                    !isDeadlinePassed &&
                    isBefore(parseISO(competition.registrationDeadline), new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000));
                  
                  return (
                    <Link key={competition.id} href="/athlete/competitions">
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{competition.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(competition.date), 'dd.MM.yyyy', { locale: de })}
                            {competition.location && ` • ${competition.location}`}
                          </p>
                          {competition.registrationDeadline && !competition.isRegistered && !isDeadlinePassed && (
                            <p className={`text-xs mt-1 ${isDeadlineSoon ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                              <AlertCircle className="h-3 w-3 inline mr-1" />
                              Anmeldeschluss: {format(parseISO(competition.registrationDeadline), 'dd.MM.yyyy')}
                            </p>
                          )}
                        </div>
                        <div className="ml-2">
                          {competition.isRegistered ? (
                            <Badge className="bg-emerald-100 text-emerald-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Angemeldet
                            </Badge>
                          ) : isDeadlinePassed ? (
                            <Badge variant="secondary">Geschlossen</Badge>
                          ) : (
                            <Badge variant="outline">Offen</Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Files */}
      {data.recentFiles && data.recentFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Neue Dateien
              </span>
              <Link href="/athlete/files">
                <Button variant="ghost" size="sm" className="h-8">
                  Alle <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>Kürzlich hochgeladene Dokumente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentFiles.map((file) => (
                <Link key={file.id} href="/athlete/files">
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{file.title}</p>
                        <p className="text-xs text-muted-foreground">{file.category}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(file.uploadedAt), 'dd.MM.yyyy')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
