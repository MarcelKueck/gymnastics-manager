'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { TrainerHoursEditor } from './trainer-hours-editor';

export function AdminHoursContent() {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchSummaries();
    }
  }, [selectedMonth, selectedYear]);

  const fetchSummaries = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(
        `/api/admin/trainer-hours?month=${selectedMonth}&year=${selectedYear}`
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Laden der Stunden');
      }

      const data = await response.json();
      setSummaries(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustHours = async (
    summaryId: string,
    adjustedHours: number,
    notes: string
  ) => {
    const response = await fetch(`/api/admin/trainer-hours/${summaryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adjustedHours, notes }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Fehler beim Anpassen');
    }

    await fetchSummaries();
  };

  const handleExport = async () => {
    const response = await fetch(
      `/api/admin/trainer-hours/export?month=${selectedMonth}&year=${selectedYear}`
    );

    if (!response.ok) {
      throw new Error('Fehler beim Exportieren');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trainer-hours-${selectedYear}-${selectedMonth.toString().padStart(2, '0')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);
  const months = [
    { value: 1, label: 'Januar' },
    { value: 2, label: 'Februar' },
    { value: 3, label: 'März' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Dezember' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Trainer-Stunden</h1>
        <p className="text-muted-foreground">
          Verwalte und passe Trainer-Stunden an
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Month/Year Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Zeitraum auswählen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="month">Monat</Label>
              <select
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <Label htmlFor="year">Jahr</Label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchSummaries} disabled={isLoading}>
                Aktualisieren
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hours Editor */}
      {isLoading ? (
        <Loading />
      ) : !summaries || summaries.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            Keine Stunden für den ausgewählten Zeitraum gefunden
          </CardContent>
        </Card>
      ) : (
        <TrainerHoursEditor
          month={selectedMonth}
          year={selectedYear}
          summaries={summaries}
          onAdjustHours={handleAdjustHours}
          onExport={handleExport}
        />
      )}
    </div>
  );
}
