'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { StatCard } from '@/components/ui/stat-card';
import { 
  BarChart3, 
  Users, 
  Shield, 
  Repeat, 
  AlertCircle, 
  FileText, 
  Calendar,
  Activity,
  TrendingUp,
  XCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface AdminStatistics {
  system: {
    totalAthletes: number;
    approvedAthletes: number;
    pendingApprovals: number;
    totalTrainers: number;
    activeTrainers: number;
    totalRecurringTrainings: number;
    totalUploads: number;
    activeUploads: number;
  };
  sessions: {
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
    completed: number;
    cancelled: number;
  };
  attendance: {
    thisYearTotal: number;
    present: number;
    absentExcused: number;
    absentUnexcused: number;
    attendanceRate: number;
  };
  recentActivity: Array<{
    id: string;
    entityType: string;
    action: string;
    performedAt: string;
    performedBy: string;
  }>;
  topPerformingAthletes: Array<{
    id: string;
    name: string;
    attendanceRate: number;
    sessionsAttended: number;
  }>;
  uploadsByCategory: Array<{
    category: string;
    count: number;
  }>;
}

const entityTypeTranslations: Record<string, string> = {
  attendance: 'Anwesenheit',
  athlete: 'Athlet',
  session: 'Training',
  trainer: 'Trainer',
  upload: 'Upload',
  recurringTraining: 'Wiederkehrendes Training',
};

const actionTranslations: Record<string, string> = {
  create: 'Erstellt',
  update: 'Aktualisiert',
  delete: 'Gelöscht',
};

export default function AdminStatisticsPage() {
  const [statistics, setStatistics] = useState<AdminStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/statistics');
      if (!response.ok) throw new Error('Failed to load statistics');
      const data = await response.json();
      setStatistics(data);
    } catch (err) {
      setError('Fehler beim Laden der Statistiken');
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
          <p className="mt-4 text-gray-600">Lade Statistiken...</p>
        </div>
      </div>
    );
  }

  if (error || !statistics) {
    return <Alert variant="error">{error || 'Statistiken nicht verfügbar'}</Alert>;
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Statistiken</h1>
        <p className="text-gray-600 mt-1">Umfassende Übersicht über das gesamte System</p>
      </div>

      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Systemübersicht
          </CardTitle>
          <CardDescription>Aktuelle Zahlen im gesamten System</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Athleten"
              value={statistics.system.totalAthletes}
              icon={Users}
              color="blue"
              subtitle={`${statistics.system.approvedAthletes} freigegeben`}
            />
            <StatCard
              title="Trainer"
              value={statistics.system.totalTrainers}
              icon={Shield}
              color="teal"
              subtitle={`${statistics.system.activeTrainers} aktiv`}
            />
            <StatCard
              title="Wiederkehrende Trainings"
              value={statistics.system.totalRecurringTrainings}
              icon={Repeat}
              color="green"
              subtitle="Aktive Konfigurationen"
            />
            <StatCard
              title="Ausstehende Freigaben"
              value={statistics.system.pendingApprovals}
              icon={AlertCircle}
              color="orange"
              subtitle="Zu bearbeitende Athleten"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sessions Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Trainingseinheiten
          </CardTitle>
          <CardDescription>Übersicht über geplante und durchgeführte Trainings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Diese Woche"
              value={statistics.sessions.thisWeek}
              icon={Clock}
              color="blue"
              subtitle="Geplante Einheiten"
            />
            <StatCard
              title="Dieser Monat"
              value={statistics.sessions.thisMonth}
              icon={Calendar}
              color="green"
              subtitle="Geplante Einheiten"
            />
            <StatCard
              title="Dieses Jahr"
              value={statistics.sessions.thisYear}
              icon={TrendingUp}
              color="teal"
              subtitle="Gesamt"
            />
            <StatCard
              title="Abgeschlossen"
              value={statistics.sessions.completed}
              icon={CheckCircle}
              color="green"
              subtitle="Dieses Jahr"
            />
            <StatCard
              title="Abgesagt"
              value={statistics.sessions.cancelled}
              icon={XCircle}
              color="red"
              subtitle="Dieses Jahr"
            />
          </div>
        </CardContent>
      </Card>

      {/* Attendance Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Anwesenheitsstatistik ({new Date().getFullYear()})
          </CardTitle>
          <CardDescription>Detaillierte Anwesenheitsdaten für das laufende Jahr</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Gesamt erfasst"
              value={statistics.attendance.thisYearTotal}
              icon={BarChart3}
              color="blue"
              subtitle="Alle Einträge"
            />
            <StatCard
              title="Anwesend"
              value={statistics.attendance.present}
              icon={CheckCircle}
              color="green"
              subtitle={`${statistics.attendance.attendanceRate}% Rate`}
            />
            <StatCard
              title="Entschuldigt"
              value={statistics.attendance.absentExcused}
              icon={AlertCircle}
              color="orange"
              subtitle="Abwesend"
            />
            <StatCard
              title="Unentschuldigt"
              value={statistics.attendance.absentUnexcused}
              icon={XCircle}
              color="red"
              subtitle="Abwesend"
            />
            <StatCard
              title="Anwesenheitsrate"
              value={`${statistics.attendance.attendanceRate}%`}
              icon={TrendingUp}
              color="teal"
              subtitle="Durchschnitt"
            />
          </div>
        </CardContent>
      </Card>

      {/* Documents/Uploads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Dokumente & Uploads
          </CardTitle>
          <CardDescription>Übersicht über hochgeladene Dateien</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <StatCard
              title="Gesamt Uploads"
              value={statistics.system.totalUploads}
              icon={FileText}
              color="purple"
              subtitle="Alle Dateien"
            />
            <StatCard
              title="Aktive Uploads"
              value={statistics.system.activeUploads}
              icon={FileText}
              color="blue"
              subtitle="Derzeit verfügbar"
            />
          </div>

          {statistics.uploadsByCategory.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Uploads nach Kategorie</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {statistics.uploadsByCategory.map((category, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <p className="font-medium text-sm text-gray-900">{category.category}</p>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                      {category.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Performing Athletes */}
      {statistics.topPerformingAthletes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Beste Anwesenheit
            </CardTitle>
            <CardDescription>Athleten mit der höchsten Anwesenheitsrate dieses Jahr</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statistics.topPerformingAthletes.map((athlete, index) => (
                <div
                  key={athlete.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{athlete.name}</p>
                      <p className="text-sm text-gray-600">
                        {athlete.sessionsAttended} Trainingseinheiten besucht
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-teal-600">{athlete.attendanceRate}%</p>
                    <p className="text-xs text-gray-500">Anwesenheitsrate</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent System Activity */}
      {statistics.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Letzte Systemaktivitäten
            </CardTitle>
            <CardDescription>Die 15 neuesten Änderungen im System</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {statistics.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {actionTranslations[activity.action] || activity.action}:{' '}
                      {entityTypeTranslations[activity.entityType] || activity.entityType}
                    </p>
                    <p className="text-xs text-gray-600">durch {activity.performedBy}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {format(new Date(activity.performedAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
