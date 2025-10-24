'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, CalendarRange } from 'lucide-react';
import { toast } from 'sonner';

interface BulkCancellationDialogProps {
  onSuccess: () => void;
}

export function BulkCancellationDialog({ onSuccess }: BulkCancellationDialogProps) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (reason.trim().length < 10) {
      setError('Grund muss mindestens 10 Zeichen lang sein');
      return;
    }

    if (!startDate || !endDate) {
      setError('Bitte wähle ein Start- und Enddatum');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Startdatum muss vor dem Enddatum liegen');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/athlete/cancellations?bulk=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate,
          endDate,
          reason,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Absagen');
      }

      const data = await response.json();
      toast.success(data.message || 'Trainingseinheiten erfolgreich abgesagt');
      setOpen(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Absagen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CalendarRange className="h-4 w-4 mr-2" />
          Zeitraum absagen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Zeitraum absagen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sage alle Trainingseinheiten in einem bestimmten Zeitraum ab (z.B. bei Urlaub oder
            Verletzung).
          </p>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Von</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Bis</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                min={startDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Grund (mindestens 10 Zeichen)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="z.B. Urlaub, Verletzung, Krankheit..."
              rows={4}
              required
              minLength={10}
            />
            <p className="text-xs text-muted-foreground">{reason.length}/10 Zeichen</p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading || reason.trim().length < 10}>
              {isLoading ? 'Wird abgesagt...' : 'Zeitraum absagen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
