'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertCircle, Ban, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface BulkCancelDialogProps {
  onSuccess?: () => void;
}

export function BulkCancelDialog({ onSuccess }: BulkCancelDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reason, setReason] = useState('');
  const [sendNotification, setSendNotification] = useState(true);
  const [isRange, setIsRange] = useState(false);

  const resetForm = () => {
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setEndDate(format(new Date(), 'yyyy-MM-dd'));
    setReason('');
    setSendNotification(true);
    setIsRange(false);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const payload = {
        startDate: new Date(startDate).toISOString(),
        endDate: isRange ? new Date(endDate).toISOString() : new Date(startDate).toISOString(),
        reason,
        sendNotification,
      };

      const res = await fetch('/api/admin/sessions/cancel-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Fehler beim Absagen');
      }

      setSuccess(result.message);
      
      // Close dialog after a short delay on success
      setTimeout(() => {
        setOpen(false);
        resetForm();
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Ban className="h-4 w-4 mr-2" />
          Training(s) absagen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Trainingseinheit(en) absagen</DialogTitle>
            <DialogDescription>
              Sage alle Trainingseinheiten für einen Tag oder Zeitraum ab.
              Alle Athleten und Trainer werden optional per E-Mail benachrichtigt.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isRange" 
                checked={isRange}
                onCheckedChange={(checked) => setIsRange(checked === true)}
              />
              <Label htmlFor="isRange" className="text-sm font-normal">
                Zeitraum auswählen (mehrere Tage)
              </Label>
            </div>

            <div className={`grid gap-4 ${isRange ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div className="grid gap-2">
                <Label htmlFor="startDate">{isRange ? 'Von' : 'Datum'}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              {isRange && (
                <div className="grid gap-2">
                  <Label htmlFor="endDate">Bis</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    required
                  />
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">Begründung</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="z.B. Hallensperrung, Feiertag, etc."
                rows={3}
                required
                minLength={5}
              />
              <p className="text-xs text-muted-foreground">
                {reason.length}/5 Zeichen (mind. 5 erforderlich)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="sendNotification" 
                checked={sendNotification}
                onCheckedChange={(checked) => setSendNotification(checked === true)}
              />
              <Label htmlFor="sendNotification" className="text-sm font-normal">
                E-Mail-Benachrichtigung an Betroffene senden
              </Label>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-md">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-green-600 text-sm p-3 bg-green-50 rounded-md">
                <AlertCircle className="h-4 w-4" />
                {success}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              Abbrechen
            </Button>
            <Button 
              type="submit" 
              variant="destructive"
              disabled={isSubmitting || reason.length < 5}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wird abgesagt...
                </>
              ) : (
                'Absagen'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
