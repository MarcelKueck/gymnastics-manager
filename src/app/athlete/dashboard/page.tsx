'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Calendar, CheckCircle, AlertCircle, XCircle, TrendingUp, Clock } from 'lucide-react';

interface DashboardStats {
  upcomingSessions: number;
  totalPresent: number;
  totalAbsent: number;
  unexcusedAbsences: number;
  attendancePercentage: number;
  recentSessions: Array<{
    date: string;
    status: string;
  }>;
  nextSession?: {
    id: string;
    date: string;
    trainingName: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    groupName: string | null;
    isCancelled: boolean;
  } | null;
}

export default function AthleteDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/athlete/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard');
      
      const data = await response.json();
      setDashboardData(data);
    } catch {
      setError('Fehler beim Laden der Dashboard-Daten');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Willkommen zurück!</p>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#509f28] mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <Alert variant="error">{error}</Alert>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const stats = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Willkommen zurück! Hier ist deine Übersicht.
        </p>
      </div>

      {/* Warning for unexcused absences */}
      {(stats.unexcusedAbsences || 0) >= 3 && (
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <div className="ml-2">
            <strong>Achtung:</strong> Du hast {stats.unexcusedAbsences} unentschuldigte Fehlzeiten.
            Bitte kontaktiere deinen Trainer.
          </div>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Kommende Trainings
            </CardTitle>
            <Calendar className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.upcomingSessions || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Nächste 30 Tage</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Anwesend
            </CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalPresent || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Letzte 3 Monate</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-white border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Entschuldigt
            </CardTitle>
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {(stats.totalAbsent || 0) - (stats.unexcusedAbsences || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Letzte 3 Monate</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-white border-red-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Unentschuldigt
            </CardTitle>
            <XCircle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.unexcusedAbsences || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Letzte 3 Monate</p>
          </CardContent>
        </Card>
      </div>

      {/* Next Session Card */}
      {stats.nextSession && !stats.nextSession.isCancelled && (
        <Card className="bg-gradient-to-br from-[#509f28]/10 to-white border-[#509f28]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#509f28]" />
              Nächstes Training
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(stats.nextSession.date).toLocaleDateString('de-DE', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {stats.nextSession.startTime} - {stats.nextSession.endTime} Uhr
                  {stats.nextSession.groupName && (
                    <span className="ml-2">• {stats.nextSession.groupName}</span>
                  )}
                </p>
                {stats.nextSession.trainingName && (
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.nextSession.trainingName}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Percentage */}
      {stats.attendancePercentage !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#509f28]" />
              Anwesenheitsrate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="text-5xl font-bold text-[#509f28]">{stats.attendancePercentage}%</div>
              <div className="pb-2 text-sm text-gray-600">
                basierend auf den letzten 3 Monaten
              </div>
            </div>
            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#509f28] transition-all"
                style={{ width: `${stats.attendancePercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            Letzte Trainingseinheiten
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!stats.recentSessions || stats.recentSessions.length === 0 ? (
            <p className="text-sm text-gray-500">Noch keine Trainingseinheiten erfasst.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentSessions.map((session, index) => {
                const statusConfig = {
                  PRESENT: {
                    icon: CheckCircle,
                    text: 'Anwesend',
                    color: 'text-green-600',
                    bg: 'bg-green-50',
                  },
                  ABSENT_EXCUSED: {
                    icon: AlertCircle,
                    text: 'Entschuldigt',
                    color: 'text-yellow-600',
                    bg: 'bg-yellow-50',
                  },
                  ABSENT_UNEXCUSED: {
                    icon: XCircle,
                    text: 'Unentschuldigt',
                    color: 'text-red-600',
                    bg: 'bg-red-50',
                  },
                };

                const config = statusConfig[session.status as keyof typeof statusConfig];
                const Icon = config.icon;

                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 sm:p-4 rounded-lg ${config.bg} border border-gray-200`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${config.color}`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(session.date).toLocaleDateString('de-DE', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </p>
                        <p className={`text-xs sm:text-sm ${config.color}`}>{config.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}