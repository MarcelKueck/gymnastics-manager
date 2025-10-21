'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { UserCheck, Calendar, X, Users, Shield } from 'lucide-react';
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

interface PendingTrainer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  createdAt: string;
}

const genderTranslations: Record<string, string> = {
  MALE: 'Männlich',
  FEMALE: 'Weiblich',
  OTHER: 'Divers',
};

export default function UnifiedApprovals() {
  const [athletes, setAthletes] = useState<PendingAthlete[]>([]);
  const [trainers, setTrainers] = useState<PendingTrainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<PendingAthlete | null>(null);
  const [showAthleteModal, setShowAthleteModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'athletes' | 'trainers'>('athletes');

  useEffect(() => {
    fetchPendingData();
  }, []);

  const fetchPendingData = async () => {
    try {
      setLoading(true);
      const [athletesRes, trainersRes] = await Promise.all([
        fetch('/api/admin/athletes/pending'),
        fetch('/api/admin/trainers/pending'),
      ]);

      if (!athletesRes.ok || !trainersRes.ok) {
        throw new Error('Failed to fetch pending approvals');
      }

      const [athletesData, trainersData] = await Promise.all([
        athletesRes.json(),
        trainersRes.json(),
      ]);

      setAthletes(athletesData.athletes);
      setTrainers(trainersData.trainers);
    } catch (err) {
      setError('Fehler beim Laden der ausstehenden Genehmigungen');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAthlete = (athlete: PendingAthlete) => {
    setSelectedAthlete(athlete);
    setShowAthleteModal(true);
  };

  const handleRejectAthlete = async (athleteId: string, athleteName: string) => {
    if (!confirm(`Möchten Sie die Anmeldung von ${athleteName} wirklich ablehnen? Dies kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    try {
      setProcessingId(athleteId);
      const response = await fetch('/api/admin/athletes/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject athlete');
      }

      await fetchPendingData();
    } catch (err) {
      alert('Fehler beim Ablehnen der Anmeldung');
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveTrainer = async (trainerId: string) => {
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

      await fetchPendingData();
    } catch (err) {
      alert('Fehler beim Freischalten des Trainers');
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectTrainer = async (trainerId: string) => {
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

      await fetchPendingData();
    } catch (err) {
      alert('Fehler beim Ablehnen der Trainer-Anmeldung');
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAthleteApprovalSuccess = () => {
    setShowAthleteModal(false);
    setSelectedAthlete(null);
    fetchPendingData();
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

  const totalPending = athletes.length + trainers.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Freigaben verwalten</h1>
          <p className="text-gray-600 mt-1">
            {totalPending === 0 ? (
              'Keine ausstehenden Freigaben'
            ) : (
              <>
                {totalPending} {totalPending === 1 ? 'Anmeldung wartet' : 'Anmeldungen warten'} auf Freigabe
              </>
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('athletes')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'athletes'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <Users className="h-5 w-5" />
            Athlet
            {athletes.length > 0 && (
              <span className="ml-2 bg-orange-100 text-orange-600 py-0.5 px-2.5 rounded-full text-xs font-semibold">
                {athletes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('trainers')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'trainers'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <Shield className="h-5 w-5" />
            Trainer
            {trainers.length > 0 && (
              <span className="ml-2 bg-orange-100 text-orange-600 py-0.5 px-2.5 rounded-full text-xs font-semibold">
                {trainers.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Athletes Tab */}
      {activeTab === 'athletes' && (
        <>
          {athletes.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Keine ausstehenden Athleten-Genehmigungen
              </h3>
              <p className="text-gray-600">
                Alle Athleten-Anmeldungen wurden bereits bearbeitet.
              </p>
            </div>
          ) : (
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
                          onClick={() => handleApproveAthlete(athlete)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          variant="primary"
                          disabled={processingId === athlete.id}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Genehmigen
                        </Button>
                        <Button
                          onClick={() => handleRejectAthlete(athlete.id, `${athlete.firstName} ${athlete.lastName}`)}
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
          )}
        </>
      )}

      {/* Trainers Tab */}
      {activeTab === 'trainers' && (
        <>
          {trainers.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Keine ausstehenden Trainer-Genehmigungen
              </h3>
              <p className="text-gray-600">
                Alle Trainer-Anmeldungen wurden bereits bearbeitet.
              </p>
            </div>
          ) : (
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
                          onClick={() => handleApproveTrainer(trainer.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          variant="primary"
                          disabled={processingId === trainer.id}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Freischalten
                        </Button>
                        <Button
                          onClick={() => handleRejectTrainer(trainer.id)}
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
          )}
        </>
      )}

      {/* Athlete Approval Modal */}
      {showAthleteModal && selectedAthlete && (
        <ApprovalModal
          athlete={selectedAthlete}
          onClose={() => {
            setShowAthleteModal(false);
            setSelectedAthlete(null);
          }}
          onSuccess={handleAthleteApprovalSuccess}
        />
      )}
    </div>
  );
}
