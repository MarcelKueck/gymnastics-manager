'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface EditCancellationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cancellationId: string;
  sessionName: string;
  sessionDate: string;
  currentReason: string;
  onSuccess: () => void;
}

export function EditCancellationDialog({
  open,
  onOpenChange,
  cancellationId,
  sessionName,
  sessionDate,
  currentReason,
  onSuccess,
}: EditCancellationDialogProps) {
  const [reason, setReason] = useState(currentReason);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (reason.trim().length < 10) {
      setError('Grund muss mindestens 10 Zeichen lang sein');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/athlete/cancellations/${cancellationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Aktualisieren');
      }

      toast.success('Absage erfolgreich aktualisiert');
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Aktualisieren');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Möchtest du diese Absage wirklich rückgängig machen?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/athlete/cancellations/${cancellationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Löschen');
      }

      toast.success('Absage erfolgreich rückgängig gemacht');
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Absage bearbeiten</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              {sessionName} am {sessionDate}
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Grund (mindestens 10 Zeichen)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Bitte gib einen Grund für deine Absage an..."
              rows={4}
              required
              minLength={10}
            />
            <p className="text-xs text-muted-foreground">{reason.length}/10 Zeichen</p>
          </div>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              Absage rückgängig machen
            </Button>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isLoading || reason.trim().length < 10}>
                {isLoading ? 'Wird gespeichert...' : 'Speichern'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
