'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Users, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import Link from 'next/link';

interface DashboardStats {
  upcomingSessions: any[];
  pendingApprovals: number;
  athletesNeedingAttention: number;
  sessionsConducted: number;
  attendanceMarked: number;
}

export function TrainerDashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/trainer/dashboard');
      if (!response.ok) throw new Error('Fehler beim Laden der Daten');

      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loading />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Übersicht über deine Trainings</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ausstehende Genehmigungen"
          value={stats.pendingApprovals}
          description="Neue Anmeldungen"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Kommende Trainings"
          value={stats.upcomingSessions.length}
          description="In den nächsten 7 Tagen"
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          title="Durchgeführt"
          value={stats.sessionsConducted}
          description="Diese Woche"
          icon={<CheckCircle className="h-4 w-4" />}
        />
        {stats.athletesNeedingAttention > 0 && (
          <StatCard
            title="Benötigen Aufmerksamkeit"
            value={stats.athletesNeedingAttention}
            description="Athleten mit Fehlzeiten"
            icon={<AlertTriangle className="h-4 w-4" />}
          />
        )}
      </div>

      {/* Pending Approvals Alert */}
      {stats.pendingApprovals > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Es gibt {stats.pendingApprovals} ausstehende Athleten-Genehmigung
            {stats.pendingApprovals > 1 ? 'en' : ''}.{' '}
            <Link href="/trainer/athletes" className="underline font-medium">
              Jetzt überprüfen
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Kommende Trainingseinheiten</CardTitle>
            <Link href="/trainer/sessions">
              <Button variant="outline" size="sm">
                Alle anzeigen
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {stats.upcomingSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine kommenden Trainingseinheiten
            </p>
          ) : (
            <div className="space-y-3">
              {stats.upcomingSessions.slice(0, 5).map((session) => (
                <Link
                  key={session.id}
                  href={`/trainer/sessions/${session.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">
                          {session.recurringTraining?.name || 'Training'}
                        </h4>
                        {session.isCancelled && (
                          <Badge variant="destructive">Abgesagt</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(session.date)} - {session.startTime} bis {session.endTime}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.groups.length} Gruppe{session.groups.length !== 1 ? 'n' : ''}
                      </p>
                    </div>
                    {!session.isCancelled && (
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}