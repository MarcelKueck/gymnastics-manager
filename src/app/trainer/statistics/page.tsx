'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { PageHeader } from '@/components/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
} from 'lucide-react';

interface Statistics {
  overview: {
    totalAthletes: number;
    activeAthletes: number;
    totalSessions: number;
    averageAttendance: number;
  };
  attendance: {
    present: number;
    absentExcused: number;
    absentUnexcused: number;
  };
  weekly: {
    week: string;
    sessions: number;
    attendanceRate: number;
  }[];
  groupStats: {
    name: string;
    athleteCount: number;
    attendanceRate: number;
  }[];
}

export default function TrainerStatisticsPage() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/trainer/statistics')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((result) => setStats(result.data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <Loading />;
  if (error) return <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">Fehler beim Laden: {error}</div>;
  if (!stats) return <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">Keine Statistiken verfügbar</div>;

  const totalAttendance = stats.attendance.present + stats.attendance.absentExcused + stats.attendance.absentUnexcused;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistiken"
        description="Übersicht über Trainings und Anwesenheiten"
      />

      {/* Overview Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktive Athleten</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.activeAthletes}</div>
            <p className="text-xs text-muted-foreground">
              von {stats.overview.totalAthletes} gesamt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Trainingseinheiten</CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalSessions}</div>
            <p className="text-xs text-muted-foreground">letzte 30 Tage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ø Anwesenheit</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              stats.overview.averageAttendance >= 80 ? 'text-emerald-600' :
              stats.overview.averageAttendance >= 60 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {stats.overview.averageAttendance}%
            </div>
            <p className="text-xs text-muted-foreground">letzte 30 Tage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Anwesenheiten</CardTitle>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAttendance}</div>
            <p className="text-xs text-muted-foreground">erfasste Einträge</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">Anwesenheitsverteilung</TabsTrigger>
          <TabsTrigger value="groups">Nach Gruppen</TabsTrigger>
          <TabsTrigger value="weekly">Wochenübersicht</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Anwesenheitsverteilung</CardTitle>
              <CardDescription>Letzte 30 Tage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Visual bar chart */}
                <div className="flex h-8 rounded-lg overflow-hidden">
                  {totalAttendance > 0 ? (
                    <>
                      <div
                        className="bg-emerald-500 flex items-center justify-center text-white text-sm font-medium"
                        style={{ width: `${(stats.attendance.present / totalAttendance) * 100}%` }}
                      >
                        {Math.round((stats.attendance.present / totalAttendance) * 100)}%
                      </div>
                      <div
                        className="bg-amber-500 flex items-center justify-center text-white text-sm font-medium"
                        style={{ width: `${(stats.attendance.absentExcused / totalAttendance) * 100}%` }}
                      >
                        {stats.attendance.absentExcused > 0 && `${Math.round((stats.attendance.absentExcused / totalAttendance) * 100)}%`}
                      </div>
                      <div
                        className="bg-red-500 flex items-center justify-center text-white text-sm font-medium"
                        style={{ width: `${(stats.attendance.absentUnexcused / totalAttendance) * 100}%` }}
                      >
                        {stats.attendance.absentUnexcused > 0 && `${Math.round((stats.attendance.absentUnexcused / totalAttendance) * 100)}%`}
                      </div>
                    </>
                  ) : (
                    <div className="bg-muted w-full flex items-center justify-center text-muted-foreground text-sm">
                      Keine Daten
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-3 p-4 rounded-lg border">
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.attendance.present}</p>
                      <p className="text-sm text-muted-foreground">Anwesend</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg border">
                    <Clock className="h-8 w-8 text-amber-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.attendance.absentExcused}</p>
                      <p className="text-sm text-muted-foreground">Entschuldigt</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg border">
                    <XCircle className="h-8 w-8 text-red-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.attendance.absentUnexcused}</p>
                      <p className="text-sm text-muted-foreground">Unentschuldigt</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups">
          <Card>
            <CardHeader>
              <CardTitle>Statistiken nach Gruppen</CardTitle>
              <CardDescription>Anwesenheitsraten pro Trainingsgruppe</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.groupStats.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Keine Gruppenstatistiken verfügbar
                </p>
              ) : (
                <div className="space-y-4">
                  {stats.groupStats.map((group) => (
                    <div
                      key={group.name}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{group.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {group.athleteCount} Athleten
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${
                          group.attendanceRate >= 80 ? 'text-emerald-600' :
                          group.attendanceRate >= 60 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {group.attendanceRate}%
                        </p>
                        <p className="text-xs text-muted-foreground">Anwesenheit</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle>Wochenübersicht</CardTitle>
              <CardDescription>Trainings und Anwesenheit der letzten Wochen</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.weekly.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Keine Wochendaten verfügbar
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.weekly.map((week) => (
                    <div
                      key={week.week}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{week.week}</p>
                        <p className="text-sm text-muted-foreground">
                          {week.sessions} Trainingseinheiten
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              week.attendanceRate >= 80 ? 'bg-emerald-500' :
                              week.attendanceRate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${week.attendanceRate}%` }}
                          />
                        </div>
                        <span className={`font-medium min-w-[3rem] text-right ${
                          week.attendanceRate >= 80 ? 'text-emerald-600' :
                          week.attendanceRate >= 60 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {week.attendanceRate}%
                        </span>
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
