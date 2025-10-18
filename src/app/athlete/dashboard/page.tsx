'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface DashboardData {
  athlete: {
    firstName: string;
    lastName: string;
    isApproved: boolean;
  };
  nextSession: {
    id: string;
    date: string;
    dayOfWeek: string;
    hourNumber: number;
    groupNumber: number;
    isCancelled: boolean;
  } | null;
  upcomingSessionsCount: number;
  attendancePercentage: number;
}

const dayTranslations: Record<string, string> = {
  MONDAY: 'Montag',
  THURSDAY: 'Donnerstag',
  FRIDAY: 'Freitag',
};

export default function AthleteDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/athlete/dashboard');
      if (!response.ok) throw new Error('Failed to load dashboard');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError('Fehler beim Laden des Dashboards');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="error">
        <p className="font-medium">{error || 'Fehler beim Laden'}</p>
      </Alert>
    );
  }

  // Not approved yet
  if (!data.athlete.isApproved) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="warning">
          <div>
            <p className="font-medium mb-2">Anmeldung ausstehend</p>
            <p className="text-sm">
              Hallo {data.athlete.firstName}! Deine Anmeldung wurde eingereicht und wartet auf die
              Genehmigung durch einen Trainer. Du erhältst eine E-Mail, sobald dein Konto
              freigeschaltet wurde.
            </p>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Willkommen, {data.athlete.firstName}!
        </h1>
        <p className="mt-2 text-gray-600">
          Hier ist deine Trainingsübersicht
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Next training session */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Nächstes Training
            </CardTitle>
            <Calendar className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            {data.nextSession ? (
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {dayTranslations[data.nextSession.dayOfWeek]}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {format(new Date(data.nextSession.date), 'dd.MM.yyyy', { locale: de })}
                  {' • '}
                  {data.nextSession.hourNumber}. Stunde
                  {' • '}
                  Gruppe {data.nextSession.groupNumber}
                </p>
                {data.nextSession.isCancelled && (
                  <p className="text-sm text-red-600 mt-2 font-medium">Abgesagt</p>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">Keine kommenden Trainings</div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming sessions count */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Kommende Termine
            </CardTitle>
            <Clock className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {data.upcomingSessionsCount}
            </div>
            <p className="text-sm text-gray-600 mt-1">Nächste 30 Tage</p>
          </CardContent>
        </Card>

        {/* Attendance percentage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Anwesenheit
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {data.attendancePercentage}%
            </div>
            <p className="text-sm text-gray-600 mt-1">Letzte 3 Monate</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Schnellaktionen</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/athlete/schedule">
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Trainingsplan ansehen
            </Button>
          </Link>
          <Link href="/athlete/attendance">
            <Button variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Anwesenheit prüfen
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Info box */}
      <Alert variant="info">
        <div>
          <p className="font-medium mb-1">Hinweis</p>
          <p className="text-sm">
            Wenn du ein Training absagen musst, gehe zu &quot;Nächste Termine&quot; und klicke auf
            &quot;Absagen&quot;. Bitte gib immer einen Grund an (mindestens 10 Zeichen).
          </p>
        </div>
      </Alert>
    </div>
  );
}