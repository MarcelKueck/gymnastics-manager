'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Save, Download } from 'lucide-react';

interface TrainerSummary {
  id: string;
  trainer: {
    firstName: string;
    lastName: string;
  };
  calculatedHours: number;
  adjustedHours?: number;
  finalHours: number;
  notes?: string;
}

interface TrainerHoursEditorProps {
  month: number;
  year: number;
  summaries: TrainerSummary[];
  onAdjustHours: (
    summaryId: string,
    adjustedHours: number,
    notes: string
  ) => Promise<void>;
  onExport: () => Promise<void>;
}

export function TrainerHoursEditor({
  month,
  year,
  summaries,
  onAdjustHours,
  onExport,
}: TrainerHoursEditorProps) {
  const [adjustments, setAdjustments] = useState<
    Record<string, { hours: string; notes: string }>
  >({});
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const monthNames = [
    'Januar',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember',
  ];

  const handleAdjust = (summaryId: string, field: 'hours' | 'notes', value: string) => {
    setAdjustments((prev) => ({
      ...prev,
      [summaryId]: {
        hours: field === 'hours' ? value : prev[summaryId]?.hours || '',
        notes: field === 'notes' ? value : prev[summaryId]?.notes || '',
      },
    }));
  };

  const handleSave = async (summaryId: string) => {
    const adjustment = adjustments[summaryId];
    if (!adjustment?.hours) {
      setError('Bitte gib angepasste Stunden ein');
      return;
    }

    const hours = parseFloat(adjustment.hours);
    if (isNaN(hours) || hours < 0) {
      setError('Ungültige Stundenanzahl');
      return;
    }

    setError('');
    setSavingId(summaryId);
    try {
      await onAdjustHours(summaryId, hours, adjustment.notes || '');
      // Clear adjustment after save
      setAdjustments((prev) => {
        const newAdj = { ...prev };
        delete newAdj[summaryId];
        return newAdj;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setSavingId(null);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Exportieren');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            Trainer-Stunden für {monthNames[month - 1]} {year}
          </h3>
          <p className="text-sm text-muted-foreground">
            {summaries.length} Trainer
          </p>
        </div>
        <Button onClick={handleExport} disabled={isExporting} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exportiere...' : 'Als CSV exportieren'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {summaries.map((summary) => {
          const isEditing = !!adjustments[summary.id];
          const hasAdjustment = summary.adjustedHours !== null;

          return (
            <Card key={summary.id}>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      {summary.trainer.firstName} {summary.trainer.lastName}
                    </h4>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Berechnet</p>
                      <p className="font-medium">{summary.calculatedHours.toFixed(2)} h</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Angepasst</p>
                      <p className="font-medium">
                        {summary.adjustedHours?.toFixed(2) || '-'} h
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Final</p>
                      <p className="font-medium text-primary">
                        {summary.finalHours.toFixed(2)} h
                      </p>
                    </div>
                  </div>

                  {summary.notes && !isEditing && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Notizen:</p>
                      <p>{summary.notes}</p>
                    </div>
                  )}

                  {isEditing ? (
                    <div className="space-y-3 pt-3 border-t">
                      <div>
                        <Label htmlFor={`hours-${summary.id}`}>Angepasste Stunden</Label>
                        <Input
                          id={`hours-${summary.id}`}
                          type="number"
                          step="0.25"
                          min="0"
                          value={adjustments[summary.id]?.hours || ''}
                          onChange={(e) =>
                            handleAdjust(summary.id, 'hours', e.target.value)
                          }
                          placeholder="z.B. 8.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`notes-${summary.id}`}>Notizen</Label>
                        <Textarea
                          id={`notes-${summary.id}`}
                          value={adjustments[summary.id]?.notes || ''}
                          onChange={(e) =>
                            handleAdjust(summary.id, 'notes', e.target.value)
                          }
                          placeholder="Grund für Anpassung..."
                          rows={2}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAdjustments((prev) => {
                              const newAdj = { ...prev };
                              delete newAdj[summary.id];
                              return newAdj;
                            });
                          }}
                        >
                          Abbrechen
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleSave(summary.id)}
                          disabled={savingId === summary.id}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Speichern
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end pt-3 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleAdjust(
                            summary.id,
                            'hours',
                            (summary.adjustedHours || summary.calculatedHours).toString()
                          )
                        }
                      >
                        Anpassen
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}