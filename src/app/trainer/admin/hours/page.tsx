'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loading } from '@/components/ui/loading';
import { PageHeader } from '@/components/shared';
import {
  Clock,
  Download,
  Edit,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface TrainerHoursSummary {
  trainerId: string;
  trainerName: string;
  month: number;
  year: number;
  calculatedHours: number;
  adjustedHours: number | null;
  finalHours: number;
  notes: string | null;
  sessionCount: number;
}

interface SessionDetail {
  id: string;
  date: string;
  trainingName: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  groupNames: string[];
}

const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

export default function AdminHoursPage() {
  const [summaries, setSummaries] = useState<TrainerHoursSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  
  // Edit dialog state
  const [editingTrainer, setEditingTrainer] = useState<TrainerHoursSummary | null>(null);
  const [adjustedHours, setAdjustedHours] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Details dialog state
  const [viewingDetails, setViewingDetails] = useState<{
    trainerId: string;
    trainerName: string;
  } | null>(null);
  const [sessionDetails, setSessionDetails] = useState<SessionDetail[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const fetchHours = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/trainer-hours?month=${month}&year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setSummaries(data.data);
      }
    } catch (error) {
      console.error('Error fetching hours:', error);
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  const fetchSessionDetails = async (trainerId: string) => {
    setIsLoadingDetails(true);
    try {
      const res = await fetch(
        `/api/admin/trainer-hours?month=${month}&year=${year}&trainerId=${trainerId}`
      );
      if (res.ok) {
        const data = await res.json();
        setSessionDetails(data.data);
      }
    } catch (error) {
      console.error('Error fetching session details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchHours();
  }, [fetchHours]);

  const handlePreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleEdit = (trainer: TrainerHoursSummary) => {
    setEditingTrainer(trainer);
    setAdjustedHours(trainer.adjustedHours?.toString() || '');
    setNotes(trainer.notes || '');
  };

  const handleSave = async () => {
    if (!editingTrainer) return;
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/trainer-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerId: editingTrainer.trainerId,
          month,
          year,
          adjustedHours: adjustedHours ? parseFloat(adjustedHours) : null,
          notes: notes || null,
        }),
      });

      if (res.ok) {
        setEditingTrainer(null);
        fetchHours();
      }
    } catch (error) {
      console.error('Error saving hours:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewDetails = (trainerId: string, trainerName: string) => {
    setViewingDetails({ trainerId, trainerName });
    fetchSessionDetails(trainerId);
  };

  const handleExportCSV = async () => {
    window.open(
      `/api/admin/trainer-hours?month=${month}&year=${year}&format=csv`,
      '_blank'
    );
  };

  const totalHours = summaries.reduce((sum, s) => sum + s.finalHours, 0);
  const totalSessions = summaries.reduce((sum, s) => sum + s.sessionCount, 0);

  if (isLoading) {
    return <Loading text="Lade Trainerstunden..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trainerstunden"
        description="Monatliche Übersicht der Trainerstunden"
        actions={
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV Export
          </Button>
        }
      />

      {/* Month Navigation */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-4">
              <Select
                value={month.toString()}
                onValueChange={(v) => setMonth(parseInt(v))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((name, index) => (
                    <SelectItem key={index} value={(index + 1).toString()}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={year.toString()}
                onValueChange={(v) => setYear(parseInt(v))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktive Trainer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaries.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gesamtstunden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)} h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Trainingseinheiten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Trainer Hours Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stunden pro Trainer</CardTitle>
        </CardHeader>
        <CardContent>
          {summaries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine Trainerstunden für diesen Monat erfasst</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Trainer</th>
                    <th className="text-center py-3 px-2 font-medium">Trainings</th>
                    <th className="text-center py-3 px-2 font-medium">Berechnet</th>
                    <th className="text-center py-3 px-2 font-medium">Angepasst</th>
                    <th className="text-center py-3 px-2 font-medium">Final</th>
                    <th className="text-left py-3 px-2 font-medium">Notizen</th>
                    <th className="text-right py-3 px-2 font-medium">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((summary) => (
                    <tr key={summary.trainerId} className="border-b last:border-0">
                      <td className="py-3 px-2 font-medium">{summary.trainerName}</td>
                      <td className="py-3 px-2 text-center">{summary.sessionCount}</td>
                      <td className="py-3 px-2 text-center">
                        {summary.calculatedHours.toFixed(1)} h
                      </td>
                      <td className="py-3 px-2 text-center">
                        {summary.adjustedHours !== null ? (
                          <span className="text-blue-600">
                            {summary.adjustedHours.toFixed(1)} h
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center font-semibold">
                        {summary.finalHours.toFixed(1)} h
                      </td>
                      <td className="py-3 px-2 text-sm text-muted-foreground max-w-[200px] truncate">
                        {summary.notes || '-'}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(summary.trainerId, summary.trainerName)}
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(summary)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingTrainer} onOpenChange={() => setEditingTrainer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stunden anpassen: {editingTrainer?.trainerName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Berechnete Stunden</Label>
              <p className="text-lg font-semibold">
                {editingTrainer?.calculatedHours.toFixed(1)} h
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjustedHours">Angepasste Stunden</Label>
              <Input
                id="adjustedHours"
                type="number"
                step="0.5"
                placeholder="Leer lassen für berechnete Stunden"
                value={adjustedHours}
                onChange={(e) => setAdjustedHours(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Überschreibt die automatisch berechneten Stunden
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Input
                id="notes"
                placeholder="Optionale Anmerkungen..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTrainer(null)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Details Dialog */}
      <Dialog open={!!viewingDetails} onOpenChange={() => setViewingDetails(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Trainings: {viewingDetails?.trainerName} ({MONTH_NAMES[month - 1]} {year})
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {isLoadingDetails ? (
              <div className="py-8 text-center text-muted-foreground">
                Lade Details...
              </div>
            ) : sessionDetails.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Keine Trainings in diesem Monat
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium">Datum</th>
                    <th className="text-left py-2 px-2 font-medium">Training</th>
                    <th className="text-center py-2 px-2 font-medium">Zeit</th>
                    <th className="text-center py-2 px-2 font-medium">Dauer</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionDetails.map((session) => (
                    <tr key={session.id} className="border-b last:border-0">
                      <td className="py-2 px-2">
                        {format(new Date(session.date), 'EEE, dd.MM.', { locale: de })}
                      </td>
                      <td className="py-2 px-2">
                        <div>{session.trainingName}</div>
                        <div className="text-xs text-muted-foreground">
                          {session.groupNames.join(', ')}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center">
                        {session.startTime} - {session.endTime}
                      </td>
                      <td className="py-2 px-2 text-center font-medium">
                        {session.durationHours.toFixed(1)} h
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2">
                    <td colSpan={3} className="py-2 px-2 font-semibold text-right">
                      Gesamt:
                    </td>
                    <td className="py-2 px-2 text-center font-bold">
                      {sessionDetails.reduce((sum, s) => sum + s.durationHours, 0).toFixed(1)} h
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
