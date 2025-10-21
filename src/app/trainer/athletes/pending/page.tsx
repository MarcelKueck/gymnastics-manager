'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { UserCheck, Calendar, X } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import ApprovalModal from '@/components/trainer/approval-modal';

interface PendingAthlete {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  phone: string;
  guardianName: string | null;
  guardianEmail: string | null;
  guardianPhone: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  createdAt: string;
}

const genderTranslations: Record<string, string> = {
  MALE: 'Männlich',
  FEMALE: 'Weiblich',
  OTHER: 'Divers',
};

export default function PendingApprovals() {
  const [athletes, setAthletes] = useState<PendingAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<PendingAthlete | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingAthletes();
  }, []);

  const fetchPendingAthletes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trainer/athletes/pending');
      if (!response.ok) throw new Error('Failed to fetch pending athletes');
      const data = await response.json();
      setAthletes(data.athletes);
    } catch (err) {
      setError('Fehler beim Laden der ausstehenden Anmeldungen');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (athlete: PendingAthlete) => {
    setSelectedAthlete(athlete);
    setShowModal(true);
  };

  const handleReject = async (athleteId: string, athleteName: string) => {
    if (!confirm(`Möchten Sie die Anmeldung von ${athleteName} wirklich ablehnen? Dies kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    try {
      setProcessingId(athleteId);
      const response = await fetch('/api/trainer/athletes/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject athlete');
      }

      await fetchPendingAthletes(); // Refresh the list
    } catch (err) {
      alert('Fehler beim Ablehnen der Anmeldung');
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApprovalSuccess = () => {
    setShowModal(false);
    setSelectedAthlete(null);
    fetchPendingAthletes(); // Refresh the list
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

  if (athletes.length === 0) {
    return (
      <div className="text-center py-12">
        <UserCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Keine ausstehenden Genehmigungen
        </h3>
        <p className="text-gray-600">
          Alle Anmeldungen wurden bereits bearbeitet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ausstehende Genehmigungen</h1>
          <p className="text-gray-600 mt-1">
            {athletes.length} {athletes.length === 1 ? 'Anmeldung' : 'Anmeldungen'} warten auf Genehmigung
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {athletes.map((athlete) => {
          const daysSince = getDaysSinceRegistration(athlete.createdAt);
          const isUrgent = daysSince > 3;

          return (
            <Card key={athlete.id} className={isUrgent ? 'border-orange-300' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {athlete.firstName} {athlete.lastName}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Geboren: {format(new Date(athlete.birthDate), 'dd.MM.yyyy', { locale: de })}
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
                      <span className="font-medium">{athlete.email}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">Telefon:</span>{' '}
                      <span className="font-medium">{athlete.phone}</span>
                    </p>
                    <p>
                      <span className="text-gray-600">Geschlecht:</span>{' '}
                      <span className="font-medium">{genderTranslations[athlete.gender]}</span>
                    </p>
                  </div>
                </div>

                {/* Guardian Information */}
                {athlete.guardianName && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Erziehungsberechtigte(r)
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-gray-600">Name:</span>{' '}
                        <span className="font-medium">{athlete.guardianName}</span>
                      </p>
                      {athlete.guardianEmail && (
                        <p>
                          <span className="text-gray-600">Email:</span>{' '}
                          <span className="font-medium">{athlete.guardianEmail}</span>
                        </p>
                      )}
                      {athlete.guardianPhone && (
                        <p>
                          <span className="text-gray-600">Telefon:</span>{' '}
                          <span className="font-medium">{athlete.guardianPhone}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Emergency Contact */}
                {athlete.emergencyContactName && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Notfallkontakt</h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-gray-600">Name:</span>{' '}
                        <span className="font-medium">{athlete.emergencyContactName}</span>
                      </p>
                      {athlete.emergencyContactPhone && (
                        <p>
                          <span className="text-gray-600">Telefon:</span>{' '}
                          <span className="font-medium">{athlete.emergencyContactPhone}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleApprove(athlete)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    variant="primary"
                    disabled={processingId === athlete.id}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Genehmigen & Konfigurieren
                  </Button>
                  <Button
                    onClick={() => handleReject(athlete.id, `${athlete.firstName} ${athlete.lastName}`)}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    variant="primary"
                    disabled={processingId === athlete.id}
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

      {/* Approval Modal */}
      {showModal && selectedAthlete && (
        <ApprovalModal
          athlete={selectedAthlete}
          onClose={() => {
            setShowModal(false);
            setSelectedAthlete(null);
          }}
          onSuccess={handleApprovalSuccess}
        />
      )}
    </div>
  );
}