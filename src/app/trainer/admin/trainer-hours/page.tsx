'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Clock,
  Download,
  Mail,
  Edit,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Calculator,
  FileText,
} from 'lucide-react';

interface TrainerHours {
  id: string | null;
  trainerId: string;
  trainerName: string;
  calculatedHours: number;
  adjustedHours: number | null;
  finalHours: number;
  notes: string | null;
  lastModifiedBy: string | null;
  lastModifiedAt: string | null;
  sessionCount: number;
}

interface MonthData {
  month: number;
  year: number;
  trainers: TrainerHours[];
}

export default function TrainerHoursPage() {
  const [monthData, setMonthData] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    adjustedHours: string;
    notes: string;
  }>({ adjustedHours: '', notes: '' });
  const [calculating, setCalculating] = useState(false);

  const fetchTrainerHours = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(
        `/api/admin/trainer-hours?month=${currentMonth}&year=${currentYear}`
      );
      if (!response.ok) throw new Error('Failed to fetch trainer hours');
      const data = await response.json();
      setMonthData(data);
    } catch (error) {
      console.error('Error fetching trainer hours:', error);
      setError('Fehler beim Laden der Trainerstunden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainerHours();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, currentYear]);

  const calculateHours = async () => {
    try {
      setCalculating(true);
      setError('');
      setSuccess('');
      const response = await fetch('/api/admin/trainer-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: monthData?.month || currentMonth + 1,
          year: currentYear,
        }),
      });
      if (!response.ok) throw new Error('Failed to calculate hours');
      setSuccess('Stunden erfolgreich berechnet');
      await fetchTrainerHours();
    } catch (error) {
      console.error('Error calculating hours:', error);
      setError('Fehler beim Berechnen der Stunden');
    } finally {
      setCalculating(false);
    }
  };

  const startEditing = (trainer: TrainerHours) => {
    setEditingId(trainer.trainerId);
    setEditData({
      adjustedHours: trainer.adjustedHours?.toString() || '',
      notes: trainer.notes || '',
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditData({ adjustedHours: '', notes: '' });
  };

  const saveEditing = async (trainer: TrainerHours) => {
    try {
      setError('');
      setSuccess('');

      // First ensure summary exists by calculating
      if (!trainer.id) {
        await calculateHours();
        // Refetch to get the new ID
        const response = await fetch(
          `/api/admin/trainer-hours?month=${currentMonth}&year=${currentYear}`
        );
        const data = await response.json();
        const updatedTrainer = data.trainers.find(
          (t: TrainerHours) => t.trainerId === trainer.trainerId
        );
        if (!updatedTrainer?.id) {
          throw new Error('Failed to create summary');
        }
        trainer = updatedTrainer;
      }

      const adjustedHours = editData.adjustedHours
        ? parseFloat(editData.adjustedHours)
        : null;

      const response = await fetch('/api/admin/trainer-hours', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summaryId: trainer.id,
          adjustedHours,
          notes: editData.notes,
        }),
      });

      if (!response.ok) throw new Error('Failed to update hours');

      setSuccess('Stunden erfolgreich aktualisiert');
      setEditingId(null);
      await fetchTrainerHours();
    } catch (error) {
      console.error('Error updating hours:', error);
      setError('Fehler beim Aktualisieren der Stunden');
    }
  };

  const downloadCSV = async () => {
    try {
      const response = await fetch(
        `/api/admin/trainer-hours/export?month=${currentMonth}&year=${currentYear}`
      );
      if (!response.ok) throw new Error('Failed to export CSV');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trainer-stunden-${getMonthName()}-${currentYear}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      setError('Fehler beim Herunterladen der CSV-Datei');
    }
  };

  const shareViaEmail = () => {
    if (!monthData) return;

    const monthName = getMonthName();
    const totalHours = monthData.trainers.reduce(
      (sum, t) => sum + t.finalHours,
      0
    );

    const emailBody = `Sehr geehrte Damen und Herren,

anbei finden Sie die Übersicht der Trainerstunden für ${monthName} ${currentYear}.

Zusammenfassung:
- Monat: ${monthName} ${currentYear}
- Anzahl Trainer: ${monthData.trainers.length}
- Gesamtstunden: ${totalHours.toFixed(2)} Stunden

Detaillierte Auflistung:
${monthData.trainers
  .map(
    (t) =>
      `- ${t.trainerName}: ${t.finalHours.toFixed(2)} Stunden (${
        t.sessionCount
      } Trainings)`
  )
  .join('\n')}

Die vollständige CSV-Datei mit allen Details ist im Anhang.

Mit freundlichen Grüßen`;

    const subject = `Trainerstunden ${monthName} ${currentYear}`;
    const mailtoLink = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(emailBody)}`;

    window.location.href = mailtoLink;
  };

  const getMonthName = () => {
    return new Date(currentYear, currentMonth, 1).toLocaleDateString('de-DE', {
      month: 'long',
    });
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Trainerstunden-Übersicht
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Monatliche Arbeitsstunden-Verwaltung
          </p>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#509f28] mx-auto"></div>
        </div>
      </div>
    );
  }

  const totalHours = monthData?.trainers.reduce(
    (sum, t) => sum + t.finalHours,
    0
  ) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Trainerstunden-Übersicht
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Monatliche Arbeitsstunden-Verwaltung für Gehaltsabrechnung
        </p>
      </div>

      {/* Alerts */}
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Month Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goToPreviousMonth}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Vorheriger Monat
            </Button>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {getMonthName()} {currentYear}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {monthData?.trainers.length || 0} Trainer
              </p>
            </div>
            <Button
              variant="outline"
              onClick={goToNextMonth}
              className="flex items-center gap-2"
            >
              Nächster Monat
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-600" />
            Gesamtübersicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Gesamtstunden</p>
              <p className="text-3xl font-bold text-gray-900">
                {totalHours.toFixed(2)}
              </p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Aktive Trainer</p>
              <p className="text-3xl font-bold text-gray-900">
                {monthData?.trainers.length || 0}
              </p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Durchschnitt pro Trainer</p>
              <p className="text-3xl font-bold text-gray-900">
                {monthData && monthData.trainers.length > 0
                  ? (totalHours / monthData.trainers.length).toFixed(2)
                  : '0.00'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={calculateHours}
          disabled={calculating}
          className="flex items-center gap-2 bg-[#509f28] hover:bg-[#3d7a1f]"
        >
          <Calculator className="h-4 w-4" />
          {calculating ? 'Berechne...' : 'Stunden Berechnen'}
        </Button>
        <Button
          onClick={downloadCSV}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          CSV Herunterladen
        </Button>
        <Button
          onClick={shareViaEmail}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Mail className="h-4 w-4" />
          Per E-Mail Teilen
        </Button>
      </div>

      {/* Trainer Hours Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Trainerstunden Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Trainer
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">
                    Trainings
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">
                    Berechnet
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">
                    Angepasst
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">
                    Final
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Notizen
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthData?.trainers.map((trainer) => (
                  <tr key={trainer.trainerId} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {trainer.trainerName}
                        </p>
                        {trainer.lastModifiedBy && (
                          <p className="text-xs text-gray-500">
                            Geändert von {trainer.lastModifiedBy}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700">
                      {trainer.sessionCount}
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700">
                      {trainer.calculatedHours.toFixed(2)}h
                    </td>
                    <td className="text-right py-3 px-4">
                      {editingId === trainer.trainerId ? (
                        <Input
                          type="number"
                          step="0.25"
                          value={editData.adjustedHours}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              adjustedHours: e.target.value,
                            })
                          }
                          className="w-24 text-right"
                          placeholder="Leer = Auto"
                        />
                      ) : trainer.adjustedHours !== null ? (
                        <span className="text-orange-600 font-medium">
                          {trainer.adjustedHours.toFixed(2)}h
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="font-bold text-gray-900">
                        {trainer.finalHours.toFixed(2)}h
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {editingId === trainer.trainerId ? (
                        <Textarea
                          value={editData.notes}
                          onChange={(e) =>
                            setEditData({ ...editData, notes: e.target.value })
                          }
                          className="min-h-[60px]"
                          placeholder="Notizen..."
                        />
                      ) : trainer.notes ? (
                        <span className="text-sm text-gray-600">
                          {trainer.notes}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      {editingId === trainer.trainerId ? (
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveEditing(trainer)}
                            className="bg-[#509f28] hover:bg-[#3d7a1f]"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditing}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(trainer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {monthData?.trainers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Keine Trainer für diesen Monat gefunden
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            Hinweise zur Verwendung:
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>
              Klicken Sie auf &quot;Stunden Berechnen&quot;, um die Stunden basierend auf
              abgeschlossenen Trainings zu berechnen
            </li>
            <li>
              Nur abgeschlossene (nicht abgesagte) Trainings werden gezählt
            </li>
            <li>
              Sie können die berechneten Stunden manuell anpassen, indem Sie auf
              &quot;Bearbeiten&quot; klicken
            </li>
            <li>
              &quot;CSV Herunterladen&quot; erstellt eine Datei für Ihre Buchhaltung
            </li>
            <li>
              &quot;Per E-Mail Teilen&quot; öffnet Ihr E-Mail-Programm mit einer vorgefertigten
              Nachricht
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
