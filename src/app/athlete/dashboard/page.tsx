'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { PageLoader, SkeletonStats, SkeletonCard } from '@/components/ui/loading';
import { Calendar, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';

interface DashboardStats {
  upcomingSessions: number;
  totalPresent: number;
  totalAbsent: number;
  unexcusedAbsences: number;
  recentSessions: Array<{
    date: string;
    status: string;
  }>;
}

export default function AthleteDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
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
      setStats(data);
    } catch (err) {
      setError('Fehler beim Laden der Dashboard-Daten');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Willkommen zurück!</p>
        </div>
        <SkeletonStats count={4} />
        <SkeletonCard count={1} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Alert variant="destructive">{error}</Alert>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Willkommen zurück! Hier ist deine Übersicht.
        </p>
      </div>

      {/* Warning for unexcused absences */}
      {(stats.unexcusedAbsences || 0) >= 3 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div className="ml-2">
            <strong>Achtung:</strong> Du hast {stats.unexcusedAbsences} unentschuldigte Fehlzeiten.
            Bitte kontaktiere deinen Trainer.
          </div>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-6 bg-gradient-to-br from-teal-50 to-white border-teal-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Kommende Trainings
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                {stats.upcomingSessions || 0}
              </p>
            </div>
            <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-teal-600" />
          </div>
        </Card>

        <Card className="p-4 sm:p-6 bg-gradient-to-br from-green-50 to-white border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Anwesend
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                {stats.totalPresent || 0}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
          </div>
        </Card>

        <Card className="p-4 sm:p-6 bg-gradient-to-br from-yellow-50 to-white border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Entschuldigt
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                {(stats.totalAbsent || 0) - (stats.unexcusedAbsences || 0)}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-4 sm:p-6 bg-gradient-to-br from-red-50 to-white border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Unentschuldigt
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                {stats.unexcusedAbsences || 0}
              </p>
            </div>
            <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
          Letzte Trainingseinheiten
        </h2>
        {!stats.recentSessions || stats.recentSessions.length === 0 ? (
          <p className="text-sm sm:text-base text-gray-500">
            Noch keine Trainingseinheiten erfasst.
          </p>
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
                      <p className={`text-xs sm:text-sm ${config.color}`}>
                        {config.text}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-teal-50 to-white border-teal-200">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
          Schnellzugriff
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="/athlete/schedule"
            className="block p-4 bg-white rounded-lg border-2 border-teal-200 hover:border-teal-400 hover:bg-teal-50 transition-all text-center"
          >
            <Calendar className="w-6 h-6 mx-auto mb-2 text-teal-600" />
            <p className="text-sm font-medium text-gray-900">Trainingstermine</p>
          </a>
          <a
            href="/athlete/training-plans"
            className="block p-4 bg-white rounded-lg border-2 border-teal-200 hover:border-teal-400 hover:bg-teal-50 transition-all text-center"
          >
            <FileText className="w-6 h-6 mx-auto mb-2 text-teal-600" />
            <p className="text-sm font-medium text-gray-900">Trainingspläne</p>
          </a>
          <a
            href="/athlete/attendance"
            className="block p-4 bg-white rounded-lg border-2 border-teal-200 hover:border-teal-400 hover:bg-teal-50 transition-all text-center"
          >
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-teal-600" />
            <p className="text-sm font-medium text-gray-900">Anwesenheit</p>
          </a>
        </div>
      </Card>
    </div>
  );
}