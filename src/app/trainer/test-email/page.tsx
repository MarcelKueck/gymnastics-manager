'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';

export default function TestEmailPage() {
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const sendTestEmail = async (type: string) => {
    if (!testEmail) {
      setResult({ type: 'error', message: 'Bitte E-Mail-Adresse eingeben' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, testEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ type: 'success', message: data.message });
      } else {
        setResult({ type: 'error', message: data.error || 'Fehler beim Senden' });
      }
    } catch (error) {
      setResult({ type: 'error', message: 'Netzwerkfehler' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">E-Mail Tester</h1>
        <p className="text-gray-600 mt-2">
          Teste die E-Mail-Benachrichtigungen des Systems
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Test E-Mail-Adresse</Label>
            <Input
              id="email"
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              Die E-Mails werden an diese Adresse gesendet
            </p>
          </div>

          {result && (
            <Alert variant={result.type === 'success' ? 'success' : 'error'}>
              {result.message}
            </Alert>
          )}

          <div className="space-y-3 pt-4">
            <h3 className="font-semibold text-gray-900">E-Mail-Typen testen:</h3>

            <div className="grid gap-3">
              <Button
                onClick={() => sendTestEmail('approval')}
                disabled={loading}
                className="w-full justify-start bg-teal-600 hover:bg-teal-700"
              >
                {loading ? 'Wird gesendet...' : '1. Athlet freigeschaltet'}
              </Button>

              <Button
                onClick={() => sendTestEmail('schedule_change')}
                disabled={loading}
                className="w-full justify-start bg-teal-600 hover:bg-teal-700"
              >
                {loading ? 'Wird gesendet...' : '2. Trainingstermine geändert'}
              </Button>

              <Button
                onClick={() => sendTestEmail('training_plan')}
                disabled={loading}
                className="w-full justify-start bg-teal-600 hover:bg-teal-700"
              >
                {loading ? 'Wird gesendet...' : '3. Trainingstermine hochgeladen'}
              </Button>

              <Button
                onClick={() => sendTestEmail('absence_alert')}
                disabled={loading}
                className="w-full justify-start bg-teal-600 hover:bg-teal-700"
              >
                {loading ? 'Wird gesendet...' : '4. Fehlzeiten-Alert'}
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">
              <strong>Hinweis:</strong> Stelle sicher, dass die Umgebungsvariablen
              RESEND_API_KEY und EMAIL_FROM korrekt konfiguriert sind.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}