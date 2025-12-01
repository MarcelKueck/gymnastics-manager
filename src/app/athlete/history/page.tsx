'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/shared/empty-state';
import { History, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface AttendanceRecord {
  id: string;
  date: string;
  name: string;
  startTime: string;
  endTime: string;
  status: 'PRESENT' | 'ABSENT_UNEXCUSED' | 'ABSENT_EXCUSED';
  notes?: string;
}

interface MonthlyStats {
  month: string;
  total: number;
  present: number;
  absent: number;
  excused: number;
  rate: number;
}

export default function AthleteHistory() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<MonthlyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/athlete/history')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((result) => {
        setRecords(result.data.records);
        setStats(result.data.stats);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <Loading />;
  if (error) return <div className="text-destructive">Fehler beim Laden: {error}</div>;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Badge className="bg-green-500">Anwesend</Badge>;
      case 'ABSENT_UNEXCUSED':
        return <Badge variant="destructive">Abwesend</Badge>;
      case 'ABSENT_EXCUSED':
        return <Badge variant="secondary">Entschuldigt</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'ABSENT_UNEXCUSED':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'ABSENT_EXCUSED':
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
      default:
        return <History className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Anwesenheitsverlauf</h1>

      {/* Monthly Stats */}
      {stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monatsübersicht</CardTitle>
            <CardDescription>
              Deine Anwesenheitsstatistik der letzten Monate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {stats.slice(0, 3).map((stat) => (
                <div
                  key={stat.month}
                  className="p-4 rounded-lg border bg-muted/30"
                >
                  <p className="text-sm text-muted-foreground">{stat.month}</p>
                  <p className="text-2xl font-bold">{stat.rate}%</p>
                  <p className="text-xs text-muted-foreground">
                    {stat.present} von {stat.total} Trainings
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>Trainingshistorie</CardTitle>
          <CardDescription>
            Alle abgeschlossenen Trainings mit deinem Anwesenheitsstatus
          </CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <EmptyState
              icon={<History className="h-10 w-10" />}
              title="Noch keine Historie"
              description="Sobald du an Trainings teilnimmst, erscheint hier dein Verlauf."
            />
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(record.status)}
                    <div>
                      <p className="font-medium">{record.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(record.date)} • {record.startTime} - {record.endTime}
                      </p>
                      {record.notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {record.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(record.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
