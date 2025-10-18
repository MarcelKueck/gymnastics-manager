'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { format, addDays, subDays, startOfWeek, addWeeks, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';

interface SessionSummary {
  date: string;
  dayOfWeek: string;
  sessionsCount: number;
  markedCount: number;
  totalAthletes: number;
}

const dayTranslations: Record<string, string> = {
  MONDAY: 'Montag',
  THURSDAY: 'Donnerstag',
  FRIDAY: 'Freitag',
};

export default function SessionsPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeekSessions();
  }, [currentWeek]);

  const fetchWeekSessions = async () => {
    try {
      setLoading(true);
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
      const response = await fetch(
        `/api/trainer/sessions/week?date=${weekStart.toISOString()}`
      );
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      setSessions(data.sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeek((prev) => addWeeks(prev, -1));
  };

  const goToNextWeek = () => {
    setCurrentWeek((prev) => addWeeks(prev, 1));
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  const getWeekRange = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    return `${format(weekStart, 'dd.MM.yyyy', { locale: de })} - ${format(
      weekEnd,
      'dd.MM.yyyy',
      { locale: de }
    )}`;
  };

  const isToday = (dateStr: string) => {
    return isSameDay(new Date(dateStr), new Date());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trainingsübersicht</h1>
        <p className="text-gray-600 mt-1">Anwesenheit markieren und Sessions verwalten</p>
      </div>

      {/* Week Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Vorherige Woche
            </Button>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">{getWeekRange()}</p>
              <Button variant="ghost" size="sm" onClick={goToToday} className="mt-1">
                Heute
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              Nächste Woche
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Keine Trainings in dieser Woche
          </h3>
          <p className="text-gray-600">Es sind keine Trainingseinheiten geplant.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card
              key={session.date}
              className={isToday(session.date) ? 'border-orange-500 border-2' : ''}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {dayTranslations[session.dayOfWeek]}
                      {isToday(session.date) && (
                        <span className="ml-2 text-sm font-normal text-orange-600">(Heute)</span>
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {format(new Date(session.date), 'dd. MMMM yyyy', { locale: de })}
                    </p>
                  </div>
                  <Link href={`/trainer/sessions/${session.date}`}>
                    <Button variant="primary">
                      <Calendar className="h-4 w-4 mr-2" />
                      Session öffnen
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{session.sessionsCount}</p>
                    <p className="text-sm text-gray-600">Trainings</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{session.totalAthletes}</p>
                    <p className="text-sm text-gray-600">Athleten</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {session.markedCount}/{session.totalAthletes}
                    </p>
                    <p className="text-sm text-gray-600">Markiert</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}