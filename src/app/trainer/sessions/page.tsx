'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  List, 
  CheckCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Users,
} from 'lucide-react';
import Link from 'next/link';

interface TrainingSession {
  id: string;
  date: string;
  name: string;
  startTime: string;
  endTime: string;
  groups: string[];
  attendanceMarked: boolean;
  isCancelled: boolean;
  expectedAthletes: number;
  presentCount: number;
}

export default function TrainerSessionsPage() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [view, setView] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    setIsLoading(true);
    const startDate = getWeekStart(currentWeekOffset);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    fetch(`/api/trainer/sessions?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((result) => setSessions(result.data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [currentWeekOffset]);

  const getWeekStart = (offset: number) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff + offset * 7);
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  const getWeekDays = () => {
    const start = getWeekStart(currentWeekOffset);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const formatWeekRange = () => {
    const start = getWeekStart(currentWeekOffset);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const getSessionsForDate = (date: Date) => {
    return sessions.filter((session) => {
      const sessionDate = new Date(session.date);
      return sessionDate.toDateString() === date.toDateString();
    });
  };

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  if (error) return <div className="text-destructive">Fehler beim Laden: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Trainingseinheiten</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentWeekOffset(0)}
            className="min-w-[200px]"
          >
            {formatWeekRange()}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as 'list' | 'calendar')}>
        <TabsList>
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-2" />
            Liste
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Kalender
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {isLoading ? (
            <Loading />
          ) : sessions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Keine Trainingseinheiten in dieser Woche</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          {isLoading ? (
            <Loading />
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {getWeekDays().map((day) => (
                <div key={day.toISOString()} className="min-h-[150px]">
                  <div
                    className={`text-center p-2 rounded-t-lg ${
                      isToday(day)
                        ? 'bg-primary text-primary-foreground'
                        : isPast(day)
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-xs">
                      {day.toLocaleDateString('de-DE', { weekday: 'short' })}
                    </div>
                    <div className="font-bold">{day.getDate()}</div>
                  </div>
                  <div className="border border-t-0 rounded-b-lg p-1 space-y-1 min-h-[100px]">
                    {getSessionsForDate(day).map((session) => (
                      <Link
                        key={session.id}
                        href={`/trainer/sessions/${session.id}`}
                        className="block"
                      >
                        <div
                          className={`p-2 rounded text-xs hover:opacity-80 transition-opacity ${
                            session.isCancelled
                              ? 'bg-destructive/20 text-destructive'
                              : session.attendanceMarked
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                          }`}
                        >
                          <div className="font-medium truncate">{session.name}</div>
                          <div>{session.startTime}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SessionCard({ session }: { session: TrainingSession }) {
  const sessionDate = new Date(session.date);
  const isPast = sessionDate < new Date();

  return (
    <Link href={`/trainer/sessions/${session.id}`}>
      <Card
        className={`hover:border-primary transition-colors ${
          session.isCancelled ? 'opacity-60' : ''
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center w-14 h-14 bg-muted rounded-lg">
                <span className="text-xs text-muted-foreground">
                  {sessionDate.toLocaleDateString('de-DE', { weekday: 'short' })}
                </span>
                <span className="text-lg font-bold">{sessionDate.getDate()}</span>
                <span className="text-xs text-muted-foreground">
                  {sessionDate.toLocaleDateString('de-DE', { month: 'short' })}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{session.name}</h3>
                  {session.isCancelled && (
                    <Badge variant="destructive">Abgesagt</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {session.startTime} - {session.endTime}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {session.groups.map((group) => (
                    <Badge key={group} variant="secondary" className="text-xs">
                      {group}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {!session.isCancelled && (
                <>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">
                      {session.attendanceMarked
                        ? `${session.presentCount}/${session.expectedAthletes}`
                        : session.expectedAthletes}
                    </span>
                  </div>
                  {isPast ? (
                    session.attendanceMarked ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <Badge variant="destructive">
                        <Clock className="h-3 w-3 mr-1" />
                        Anwesenheit fehlt
                      </Badge>
                    )
                  ) : (
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
