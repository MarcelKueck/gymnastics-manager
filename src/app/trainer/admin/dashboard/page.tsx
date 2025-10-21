'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import {
  Users,
  UserCheck,
  Calendar,
  AlertTriangle,
  FileText,
  Repeat,
  TrendingUp,
  UserPlus,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface RecentApproval {
  id: string;
  name: string;
  approvedAt: string;
  approvedBy: string;
}

interface AdminDashboardStats {
  totalAthletes: number;
  pendingApprovals: number;
  totalTrainers: number;
  todaySessions: number;
  weekSessions: number;
  activeRecurringTrainings: number;
  alertCount: number;
  recentRegistrations: number;
  cancelledSessionsThisWeek: number;
  todayAttendance: number;
  totalTrainingPlans: number;
  recentApprovals: RecentApproval[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching admin dashboard stats:', error);
      setError('Fehler beim Laden der Dashboard-Daten');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Systemübersicht</p>
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <Alert variant="error">{error}</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Systemweite Übersicht und Verwaltung
        </p>
      </div>

      {/* Alert for pending approvals */}
      {stats && stats.pendingApprovals > 0 && (
        <Alert variant="warning">
          <UserCheck className="h-4 w-4" />
          <div className="ml-2">
            <strong>Neue Anmeldungen:</strong> {stats.pendingApprovals}{' '}
            {stats.pendingApprovals === 1 ? 'Athlet wartet' : 'Athleten warten'} auf Genehmigung.
          </div>
        </Alert>
      )}

      {/* Alert for athletes with warnings */}
      {stats && stats.alertCount > 0 && (
        <Alert variant="error">
          <AlertTriangle className="h-4 w-4" />
          <div className="ml-2">
            <strong>Achtung:</strong> {stats.alertCount}{' '}
            {stats.alertCount === 1 ? 'Athlet hat' : 'Athleten haben'} 3 oder mehr unentschuldigte
            Fehlzeiten.
          </div>
        </Alert>
      )}

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Athletes */}
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Gesamte Athleten</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.totalAthletes || 0}</div>
            <Link href="/trainer/athletes">
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 p-0 h-auto text-[#509f28] hover:text-[#3d7a1f]"
              >
                Alle anzeigen →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card
          className={`bg-gradient-to-br ${
            stats && stats.pendingApprovals > 0
              ? 'from-orange-50 to-white border-orange-300'
              : 'from-gray-50 to-white border-gray-200'
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ausstehende Genehmigungen
            </CardTitle>
            <UserCheck
              className={`h-5 w-5 ${
                stats && stats.pendingApprovals > 0 ? 'text-orange-600' : 'text-gray-400'
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.pendingApprovals || 0}</div>
            <Link href="/trainer/admin/approvals">
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 p-0 h-auto text-[#509f28] hover:text-[#3d7a1f]"
              >
                Jetzt genehmigen →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Total Trainers */}
        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Aktive Trainer</CardTitle>
            <Users className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.totalTrainers || 0}</div>
            <Link href="/trainer/admin/pending-trainers">
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 p-0 h-auto text-[#509f28] hover:text-[#3d7a1f]"
              >
                Verwalten →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card
          className={`bg-gradient-to-br ${
            stats && stats.alertCount > 0
              ? 'from-red-50 to-white border-red-300'
              : 'from-gray-50 to-white border-gray-200'
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Warnungen</CardTitle>
            <AlertTriangle
              className={`h-5 w-5 ${
                stats && stats.alertCount > 0 ? 'text-red-600' : 'text-gray-400'
              }`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.alertCount || 0}</div>
            <p className="text-xs text-gray-500 mt-2">Athleten mit 3+ unentschuldigten Fehlzeiten</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sessions */}
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Heutige Trainings</CardTitle>
            <Calendar className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.todaySessions || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.todayAttendance || 0} Anwesenheit erfasst
            </p>
          </CardContent>
        </Card>

        {/* Week Sessions */}
        <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Diese Woche</CardTitle>
            <Calendar className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.weekSessions || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Geplante Trainings</p>
          </CardContent>
        </Card>

        {/* Recent Registrations */}
        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Neue Anmeldungen</CardTitle>
            <UserPlus className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.recentRegistrations || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Letzte 7 Tage</p>
          </CardContent>
        </Card>

        {/* Cancelled Sessions */}
        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Abgesagte Trainings</CardTitle>
            <XCircle className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.cancelledSessionsThisWeek || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Diese Woche</p>
          </CardContent>
        </Card>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Training System Overview */}
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5 text-green-600" />
              Trainingssystem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">Aktive Trainingseinheiten</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.activeRecurringTrainings || 0}
                  </p>
                </div>
                <Repeat className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">Trainingspläne</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalTrainingPlans || 0}</p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <Link href="/trainer/admin/recurring-trainings" className="block mt-4">
              <Button variant="outline" className="w-full">
                Trainingseinheiten verwalten
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Approvals */}
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Letzte Genehmigungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats && stats.recentApprovals.length > 0 ? (
              <div className="space-y-2">
                {stats.recentApprovals.map((approval) => (
                  <div
                    key={approval.id}
                    className="p-3 bg-white rounded-lg border border-gray-200 text-sm"
                  >
                    <p className="font-medium text-gray-900">{approval.name}</p>
                    <p className="text-xs text-gray-500">
                      Genehmigt von {approval.approvedBy} •{' '}
                      {new Date(approval.approvedAt).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Keine kürzlichen Genehmigungen</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
