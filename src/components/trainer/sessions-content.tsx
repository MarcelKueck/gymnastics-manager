'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { addDays, startOfWeek, endOfWeek } from 'date-fns';

export function TrainerSessionsContent() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  useEffect(() => {
    fetchSessions();
  }, [currentWeekStart]);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
      const params = new URLSearchParams({
        startDate: currentWeekStart.toISOString(),
        endDate: weekEnd.toISOString(),
      });

      const response = await fetch(`/api/trainer/sessions?${params.toString()}`);
      if (!response.ok) throw new Error('Fehler beim Laden der Trainingseinheiten');

      const data = await response.json();
      setSessions(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const groupedSessions = sessions.reduce((acc, session) => {
    const dateKey = formatDate(session.date);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(session);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Trainingseinheiten</h1>
        <p className="text-sm md:text-base text-muted-foreground">Verwalte und plane Trainingseinheiten</p>
      </div>

      {/* Week Navigation */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToPreviousWeek}
              className="w-full sm:w-auto"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Vorherige Woche
            </Button>
            <div className="text-center">
              <p className="font-medium text-sm md:text-base">
                {formatDate(currentWeekStart)} - {formatDate(weekEnd)}
              </p>
              <Button variant="ghost" size="sm" onClick={goToCurrentWeek} className="mt-1">
                Diese Woche
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToNextWeek}
              className="w-full sm:w-auto"
            >
              Nächste Woche
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      {isLoading ? (
        <Loading />
      ) : Object.keys(groupedSessions).length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-sm md:text-base text-muted-foreground">
            Keine Trainingseinheiten in dieser Woche
          </CardContent>
        </Card>
      ) : (
        (Object.entries(groupedSessions) as [string, any[]][]).map(([date, daySessions]) => (
          <Card key={date}>
            <CardHeader>
              <CardTitle className="text-base md:text-lg flex items-center">
                <Calendar className="h-4 w-4 md:h-5 md:w-5 mr-2 flex-shrink-0" />
                <span className="truncate">{date}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {daySessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/trainer/sessions/${session.id}`}
                    className="block"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h4 className="font-medium text-sm md:text-base truncate">
                            {session.recurringTraining?.name || 'Training'}
                          </h4>
                          {session.isCancelled && (
                            <Badge variant="destructive">Abgesagt</Badge>
                          )}
                          {session.isCompleted && (
                            <Badge variant="success">Abgeschlossen</Badge>
                          )}
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {session.startTime} - {session.endTime}
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {session.groups.length} Gruppe{session.groups.length !== 1 ? 'n' : ''}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="self-start sm:self-auto w-full sm:w-auto">
                        Details
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}