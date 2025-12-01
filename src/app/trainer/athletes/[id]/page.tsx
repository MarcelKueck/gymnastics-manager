'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface AthleteDetail {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  youthCategory?: string;
  birthDate?: string;
  groups: string[];
  joinedAt: string;
  stats: {
    totalSessions: number;
    presentCount: number;
    absentExcusedCount: number;
    absentUnexcusedCount: number;
    attendanceRate: number;
  };
  recentAttendance: {
    sessionId: string;
    date: string;
    trainingName: string;
    status: string;
    note?: string;
  }[];
  alerts: {
    id: string;
    createdAt: string;
    absenceCount: number;
    acknowledged: boolean;
  }[];
}

export default function AthleteDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [athlete, setAthlete] = useState<AthleteDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/trainer/athletes/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((result) => setAthlete(result.data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [id]);

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/trainer/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      });
      // Refresh data
      const res = await fetch(`/api/trainer/athletes/${id}`);
      const result = await res.json();
      setAthlete(result.data);
    } catch {
      // Handle error silently
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <div className="text-destructive">Fehler beim Laden: {error}</div>;
  if (!athlete) return <div>Athlet nicht gefunden</div>;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-600">Aktiv</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-600">Ausstehend</Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary">Inaktiv</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ABSENT_EXCUSED':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'ABSENT_UNEXCUSED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getAttendanceLabel = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'Anwesend';
      case 'ABSENT_EXCUSED':
        return 'Entschuldigt';
      case 'ABSENT_UNEXCUSED':
        return 'Unentschuldigt';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/trainer/athletes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{athlete.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge(athlete.status)}
            {athlete.youthCategory && (
              <Badge variant="outline">Jugend {athlete.youthCategory}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {athlete.alerts.filter((a) => !a.acknowledged).length > 0 && (
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Fehlzeiten-Warnungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {athlete.alerts
              .filter((a) => !a.acknowledged)
              .map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20"
                >
                  <div>
                    <p className="font-medium">
                      {alert.absenceCount}x unentschuldigt abwesend
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Warnung vom {formatDate(alert.createdAt)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acknowledgeAlert(alert.id)}
                  >
                    Zur Kenntnis genommen
                  </Button>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">E-Mail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${athlete.email}`} className="text-sm hover:underline">
                {athlete.email}
              </a>
            </div>
          </CardContent>
        </Card>

        {athlete.phone && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Telefon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${athlete.phone}`} className="text-sm hover:underline">
                  {athlete.phone}
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gruppen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-wrap gap-1">
                {athlete.groups.length > 0 ? (
                  athlete.groups.map((group) => (
                    <Badge key={group} variant="secondary" className="text-xs">
                      {group}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Keine Gruppen</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mitglied seit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{formatDate(athlete.joinedAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats and History */}
      <Tabs defaultValue="stats">
        <TabsList>
          <TabsTrigger value="stats">
            <TrendingUp className="h-4 w-4 mr-2" />
            Statistik
          </TabsTrigger>
          <TabsTrigger value="history">
            <Calendar className="h-4 w-4 mr-2" />
            Verlauf
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Anwesenheitsrate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${
                  athlete.stats.attendanceRate >= 80 ? 'text-green-600' :
                  athlete.stats.attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {athlete.stats.attendanceRate}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Anwesend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{athlete.stats.presentCount}</div>
                <p className="text-xs text-muted-foreground">
                  von {athlete.stats.totalSessions} Trainings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  Entschuldigt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{athlete.stats.absentExcusedCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Unentschuldigt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{athlete.stats.absentUnexcusedCount}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Letzte Trainings</CardTitle>
              <CardDescription>Anwesenheitsverlauf der letzten 90 Tage</CardDescription>
            </CardHeader>
            <CardContent>
              {athlete.recentAttendance.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Keine Anwesenheitsdaten vorhanden
                </p>
              ) : (
                <div className="space-y-2">
                  {athlete.recentAttendance.map((record) => (
                    <div
                      key={record.sessionId}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        {getAttendanceIcon(record.status)}
                        <div>
                          <p className="font-medium">{record.trainingName}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(record.date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {getAttendanceLabel(record.status)}
                        </Badge>
                        {record.note && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {record.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
