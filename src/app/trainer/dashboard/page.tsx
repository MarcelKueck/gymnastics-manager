'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Calendar, AlertTriangle, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface DashboardStats {
  totalAthletes: number;
  pendingApprovals: number;
  todaySessions: number;
  alertCount: number;
}

export default function TrainerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
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
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Willkommen zurück!</h1>
        <p className="text-gray-600 mt-2">Hier ist eine Übersicht über Ihre Trainingsgruppen</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Athletes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Aktive Athleten
            </CardTitle>
            <Users className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.totalAthletes || 0}</div>
            <Link href="/trainer/athletes">
              <Button variant="ghost" size="sm" className="mt-2 p-0 h-auto text-orange-600 hover:text-orange-700">
                Alle anzeigen →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ausstehende Genehmigungen
            </CardTitle>
            <UserCheck className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.pendingApprovals || 0}</div>
            <Link href="/trainer/athletes/pending">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 p-0 h-auto text-orange-600 hover:text-orange-700"
              >
                Jetzt genehmigen →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Today's Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Heutige Trainings
            </CardTitle>
            <Calendar className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.todaySessions || 0}</div>
            <Link href="/trainer/sessions">
              <Button variant="ghost" size="sm" className="mt-2 p-0 h-auto text-orange-600 hover:text-orange-700">
                Anwesenheit markieren →
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Warnungen
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.alertCount || 0}</div>
            <p className="text-xs text-gray-500 mt-2">
              Athleten mit 3+ unentschuldigten Fehlzeiten
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Schnellaktionen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/trainer/athletes/pending">
              <Button className="w-full" variant="outline">
                <UserCheck className="h-4 w-4 mr-2" />
                Athleten genehmigen
              </Button>
            </Link>
            <Link href="/trainer/sessions">
              <Button className="w-full" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Anwesenheit markieren
              </Button>
            </Link>
            <Link href="/trainer/training-plans">
              <Button className="w-full" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Trainingsplan hochladen
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}