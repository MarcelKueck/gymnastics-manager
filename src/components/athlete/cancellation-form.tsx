'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface CancellationFormProps {
  sessionId: string;
  sessionName: string;
  sessionDate: string;
  onSubmit: (sessionId: string, reason: string) => Promise<void>;
  onCancel: () => void;
}

export function CancellationForm({
  sessionId,
  sessionName,
  sessionDate,
  onSubmit,
  onCancel,
}: CancellationFormProps) {
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

    setIsLoading(true);
    try {
      await onSubmit(sessionId, reason);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Absagen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Training absagen</h3>
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
        <p className="text-xs text-muted-foreground">
          {reason.length}/10 Zeichen
        </p>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={isLoading || reason.trim().length < 10}>
          {isLoading ? 'Wird abgesagt...' : 'Absagen'}
        </Button>
      </div>
    </form>
  );
}