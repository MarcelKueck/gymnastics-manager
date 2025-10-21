'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { UserCheck, Calendar, X } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';

interface PendingTrainer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  createdAt: string;
}

export default function PendingTrainers() {
  const [trainers, setTrainers] = useState<PendingTrainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingTrainers();
  }, []);

  const fetchPendingTrainers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/trainers/pending');
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Nicht autorisiert. Nur Administratoren können diese Seite aufrufen.');
        }
        throw new Error('Failed to fetch pending trainers');
      }
      const data = await response.json();
      setTrainers(data.trainers);
    } catch (err) {
      setError((err as Error).message || 'Fehler beim Laden der ausstehenden Trainer-Anmeldungen');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (trainerId: string) => {
    if (!confirm('Möchten Sie diesen Trainer wirklich freischalten?')) {
      return;
    }

    try {
      setProcessingId(trainerId);
      const response = await fetch('/api/admin/trainers/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainerId }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve trainer');
      }

      await fetchPendingTrainers(); // Refresh the list
    } catch (err) {
      alert('Fehler beim Freischalten des Trainers');
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (trainerId: string) => {
    if (!confirm('Möchten Sie diese Trainer-Anmeldung wirklich ablehnen? Dies kann nicht rückgängig gemacht werden.')) {
      return;
    }

    try {
      setProcessingId(trainerId);
      const response = await fetch('/api/admin/trainers/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainerId }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject trainer');
      }

      await fetchPendingTrainers(); // Refresh the list
    } catch (err) {
      alert('Fehler beim Ablehnen der Trainer-Anmeldung');
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const getDaysSinceRegistration = (createdAt: string) => {
    return differenceInDays(new Date(), new Date(createdAt));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (trainers.length === 0) {
    return (
      <div className="text-center py-12">
        <UserCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Keine ausstehenden Trainer-Genehmigungen
        </h3>
        <p className="text-gray-600">
          Alle Trainer-Anmeldungen wurden bereits bearbeitet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ausstehende Trainer-Genehmigungen</h1>
          <p className="text-gray-600 mt-1">
            {trainers.length} {trainers.length === 1 ? 'Anmeldung' : 'Anmeldungen'} warten auf Genehmigung
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {trainers.map((trainer) => {
          const daysSince = getDaysSinceRegistration(trainer.createdAt);
          const isUrgent = daysSince > 3;

          return (
            <Card key={trainer.id} className={isUrgent ? 'border-orange-300' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {trainer.firstName} {trainer.lastName}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Registriert: {format(new Date(trainer.createdAt), 'dd.MM.yyyy', { locale: de })}
                    </p>
                  </div>
                  {isUrgent && (
                    <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded">
                      {daysSince} Tage
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact Information */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Kontaktdaten</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-gray-600">Email:</span>{' '}
                      <span className="font-medium">{trainer.email}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">Telefon:</span>{' '}
                      <span className="font-medium">{trainer.phone}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">Rolle:</span>{' '}
                      <span className="font-medium">
                        {trainer.role === 'ADMIN' ? 'Administrator' : 'Trainer'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleApprove(trainer.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    variant="primary"
                    disabled={processingId === trainer.id}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Freischalten
                  </Button>
                  <Button
                    onClick={() => handleReject(trainer.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    variant="primary"
                    disabled={processingId === trainer.id}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Ablehnen
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
