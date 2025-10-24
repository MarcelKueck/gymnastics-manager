'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { BarChart3, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { de } from 'date-fns/locale';

interface MonthlyStats {
  month: string;
  sessions: number;
  totalAttendance: number;
  present: number;
  rate: number;
}

interface AttendanceStats {
  totalSessions: number;
  totalRecords: number;
  present: number;
  excused: number;
  unexcused: number;
  attendanceRate: number;
  byCategory: Record<string, { total: number; present: number; rate: number }>;
  byTraining: Array<{ name: string; total: number; present: number; rate: number }>;
}

export function TrainerStatisticsContent() {
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [currentMonthStats, setCurrentMonthStats] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch monthly comparison
      const monthlyResponse = await fetch('/api/trainer/statistics/monthly?months=6');
      if (!monthlyResponse.ok) throw new Error('Failed to fetch monthly statistics');
      const monthlyData = await monthlyResponse.json();
      setMonthlyStats(monthlyData);

      // Fetch current month detailed stats
      const today = new Date();
      const dateFrom = format(startOfMonth(today), 'yyyy-MM-dd');
      const dateTo = format(endOfMonth(today), 'yyyy-MM-dd');
      
      const currentMonthResponse = await fetch(
        `/api/trainer/statistics/attendance?dateFrom=${dateFrom}&dateTo=${dateTo}`
      );
      if (!currentMonthResponse.ok) throw new Error('Failed to fetch attendance statistics');
      const currentMonthData = await currentMonthResponse.json();
      setCurrentMonthStats(currentMonthData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Lade Statistiken...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Fehler: {error}</div>
      </div>
    );
  }

  const currentMonth = monthlyStats[monthlyStats.length - 1];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Statistiken</h1>
        <p className="text-gray-500 mt-2">Übersicht über Anwesenheit und Trainingsdaten</p>
      </div>

      {/* Current Month Overview */}
      {currentMonthStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <StatCard
            title="Trainingseinheiten"
            value={currentMonthStats.totalSessions.toString()}
            icon={<BarChart3 className="h-4 w-4" />}
            description="Diesen Monat"
          />
          <StatCard
            title="Anwesenheitsrate"
            value={`${currentMonthStats.attendanceRate}%`}
            icon={<TrendingUp className="h-4 w-4" />}
            description={`${currentMonthStats.present} von ${currentMonthStats.totalRecords}`}
          />
          <StatCard
            title="Entschuldigt abwesend"
            value={currentMonthStats.excused.toString()}
            icon={<Users className="h-4 w-4" />}
            description="Diesen Monat"
          />
          <StatCard
            title="Unentschuldigt abwesend"
            value={currentMonthStats.unexcused.toString()}
            icon={<AlertCircle className="h-4 w-4" />}
            description="Diesen Monat"
          />
        </div>
      )}

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monatlicher Verlauf</CardTitle>
          <CardDescription>Anwesenheit der letzten 6 Monate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyStats.map((month, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{month.month}</span>
                    <span className="text-sm text-gray-500">
                      {month.rate}% ({month.present}/{month.totalAttendance})
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        month.rate >= 80
                          ? 'bg-green-500'
                          : month.rate >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${month.rate}%` }}
                    />
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-xs text-gray-500">{month.sessions} Einheiten</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* By Youth Category */}
      {currentMonthStats && Object.keys(currentMonthStats.byCategory).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nach Jugendkategorie</CardTitle>
            <CardDescription>Anwesenheit diesen Monat nach Altersgruppe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(currentMonthStats.byCategory).map(([category, stats]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Jugend {category}</span>
                      <span className="text-sm text-gray-500">
                        {stats.rate}% ({stats.present}/{stats.total})
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          stats.rate >= 80
                            ? 'bg-green-500'
                            : stats.rate >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${stats.rate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* By Training */}
      {currentMonthStats && currentMonthStats.byTraining.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nach Training</CardTitle>
            <CardDescription>Anwesenheit diesen Monat nach Trainingseinheit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentMonthStats.byTraining.map((training, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{training.name}</span>
                      <span className="text-sm text-gray-500">
                        {training.rate}% ({training.present}/{training.total})
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          training.rate >= 80
                            ? 'bg-green-500'
                            : training.rate >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${training.rate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
