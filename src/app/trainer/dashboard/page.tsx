'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Users, UserCheck, Calendar, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface DashboardStats {
  totalAthletes: number;
  pendingApprovals: number;
  todaySessions: number;
  alertCount: number;
  userRole: string;
}

export default function TrainerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = stats?.userRole === 'ADMIN';

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/trainer/dashboard');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Willkommen zurück!</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Hier ist eine Übersicht über deine Trainingsgruppen
        </p>
      </div>

      {/* Alert for pending approvals - ADMIN ONLY */}
      {stats && stats.pendingApprovals > 0 && isAdmin && (
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Athletes */}
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Aktive Athleten</CardTitle>
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

        {/* Pending Approvals - ADMIN ONLY */}
        {isAdmin && (
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
        )}

        {/* Today's Sessions */}
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Heutige Trainings</CardTitle>
            <Calendar className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.todaySessions || 0}</div>
            <Link href="/trainer/sessions">
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 p-0 h-auto text-[#509f28] hover:text-[#3d7a1f]"
              >
                Anwesenheit markieren →
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

      {/* Alert Count Details - Only show if there are alerts */}
      {stats && stats.alertCount > 0 && (
        <Card className="bg-gradient-to-br from-red-50 to-white border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Athleten mit Fehlzeiten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 mb-3">
              {stats.alertCount} {stats.alertCount === 1 ? 'Athlet hat' : 'Athleten haben'} 3 oder mehr unentschuldigte Fehlzeiten und{' '}
              {stats.alertCount === 1 ? 'benötigt' : 'benötigen'} möglicherweise ein Gespräch.
            </p>
            <p className="text-xs text-gray-600">
              Überprüfe die Anwesenheitsstatistiken in der Athletenübersicht für weitere Details.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
