'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { ArrowLeft, Users, UserPlus, X, Save } from 'lucide-react';

interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
}

interface Trainer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface RecurringTraining {
  id: string;
  name: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  groupNumber: number;
  athleteAssignments: Array<{
    athlete: Athlete;
  }>;
  trainerAssignments: Array<{
    trainer: Trainer;
    isPrimary: boolean;
  }>;
}

const dayTranslations: Record<string, string> = {
  MONDAY: 'Montag',
  THURSDAY: 'Donnerstag',
  FRIDAY: 'Freitag',
};

export default function RecurringTrainingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [training, setTraining] = useState<RecurringTraining | null>(null);
  const [allAthletes, setAllAthletes] = useState<Athlete[]>([]);
  const [allTrainers, setAllTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [showAthleteModal, setShowAthleteModal] = useState(false);
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      fetchTrainingDetail();
      fetchAllAthletes();
      fetchAllTrainers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTrainingDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/recurring-trainings/${id}`);
      if (!response.ok) throw new Error('Failed to fetch training');
      const data = await response.json();
      setTraining(data.recurringTraining);
    } catch (err) {
      setError('Fehler beim Laden des Trainings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAthletes = async () => {
    try {
      const response = await fetch('/api/trainer/athletes');
      if (!response.ok) throw new Error('Failed to fetch athletes');
      const data = await response.json();
      setAllAthletes(data.athletes || []);
    } catch (err) {
      console.error('Error fetching athletes:', err);
    }
  };

  const fetchAllTrainers = async () => {
    try {
      const response = await fetch('/api/admin/trainers');
      if (!response.ok) throw new Error('Failed to fetch trainers');
      const data = await response.json();
      setAllTrainers(data.trainers || []);
    } catch (err) {
      console.error('Error fetching trainers:', err);
    }
  };

  const handleAssignAthletes = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/admin/recurring-trainings/${id}/athletes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteIds: selectedAthletes }),
      });

      if (!response.ok) throw new Error('Failed to assign athletes');

      setSuccess('Athleten erfolgreich zugewiesen!');
      setShowAthleteModal(false);
      setSelectedAthletes([]);
      await fetchTrainingDetail();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Fehler beim Zuweisen der Athleten');
      console.error(err);
    }
  };

  const handleRemoveAthlete = async (athleteId: string) => {
    if (!confirm('Athlet wirklich entfernen?')) return;

    try {
      setError(null);
      const response = await fetch(
        `/api/admin/recurring-trainings/${id}/athletes?athleteId=${athleteId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to remove athlete');

      setSuccess('Athlet erfolgreich entfernt');
      await fetchTrainingDetail();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Fehler beim Entfernen des Athleten');
      console.error(err);
    }
  };

  const handleAssignTrainers = async () => {
    if (selectedTrainers.length === 0) {
      setError('Mindestens ein Trainer muss ausgewählt werden');
      return;
    }

    if (selectedTrainers.length > 2) {
      setError('Maximal 2 Trainer können zugewiesen werden');
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/admin/recurring-trainings/${id}/trainers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainerIds: selectedTrainers }),
      });

      if (!response.ok) throw new Error('Failed to assign trainers');

      setSuccess('Trainer erfolgreich zugewiesen!');
      setShowTrainerModal(false);
      setSelectedTrainers([]);
      await fetchTrainingDetail();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Fehler beim Zuweisen der Trainer');
      console.error(err);
    }
  };

  const toggleAthleteSelection = (athleteId: string) => {
    setSelectedAthletes((prev) =>
      prev.includes(athleteId)
        ? prev.filter((id) => id !== athleteId)
        : [...prev, athleteId]
    );
  };

  const toggleTrainerSelection = (trainerId: string) => {
    setSelectedTrainers((prev) =>
      prev.includes(trainerId)
        ? prev.filter((id) => id !== trainerId)
        : [...prev, trainerId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!training) {
    return <Alert variant="error">Training nicht gefunden</Alert>;
  }

  const assignedAthleteIds = training.athleteAssignments.map((a) => a.athlete.id);
  const assignedTrainerIds = training.trainerAssignments.map((t) => t.trainer.id);
  const availableAthletes = allAthletes.filter(
    (athlete) => !assignedAthleteIds.includes(athlete.id)
  );
  const availableTrainers = allTrainers.filter(
    (trainer) => !assignedTrainerIds.includes(trainer.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{training.name}</h1>
          <p className="text-gray-600 mt-1">
            {dayTranslations[training.dayOfWeek]} • {training.startTime} - {training.endTime} •
            Gruppe {training.groupNumber}
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Trainers Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Übungsleiter ({training.trainerAssignments.length}/2)</CardTitle>
            <Button size="sm" onClick={() => setShowTrainerModal(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Trainer zuweisen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {training.trainerAssignments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Keine Trainer zugewiesen</p>
          ) : (
            <div className="space-y-2">
              {training.trainerAssignments.map((assignment) => (
                <div
                  key={assignment.trainer.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {assignment.trainer.firstName} {assignment.trainer.lastName}
                      {assignment.isPrimary && (
                        <span className="ml-2 text-xs text-orange-600 font-semibold">
                          (Haupttrainer)
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">{assignment.trainer.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Athletes Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Athleten ({training.athleteAssignments.length})</CardTitle>
            <Button size="sm" onClick={() => setShowAthleteModal(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Athleten hinzufügen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {training.athleteAssignments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Keine Athleten zugewiesen</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {training.athleteAssignments.map((assignment) => {
                const birthYear = new Date(assignment.athlete.birthDate).getFullYear();
                return (
                  <div
                    key={assignment.athlete.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {assignment.athlete.lastName}, {assignment.athlete.firstName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Jahrgang: {birthYear}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAthlete(assignment.athlete.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Athlete Selection Modal */}
      {showAthleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Athleten hinzufügen</h3>
              <button
                onClick={() => {
                  setShowAthleteModal(false);
                  setSelectedAthletes([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {availableAthletes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Alle Athleten sind bereits zugewiesen
                </p>
              ) : (
                availableAthletes.map((athlete) => {
                  const birthYear = new Date(athlete.birthDate).getFullYear();
                  const isSelected = selectedAthletes.includes(athlete.id);
                  return (
                    <div
                      key={athlete.id}
                      onClick={() => toggleAthleteSelection(athlete.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium">
                        {athlete.lastName}, {athlete.firstName}
                      </p>
                      <p className="text-sm text-gray-600">Jahrgang: {birthYear}</p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAthleteModal(false);
                  setSelectedAthletes([]);
                }}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleAssignAthletes}
                disabled={selectedAthletes.length === 0}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {selectedAthletes.length} Athleten zuweisen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Trainer Selection Modal */}
      {showTrainerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Trainer zuweisen (max. 2)
              </h3>
              <button
                onClick={() => {
                  setShowTrainerModal(false);
                  setSelectedTrainers([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <Alert variant="default" className="mb-4">
              <p className="text-sm">
                Der erste ausgewählte Trainer wird als Haupttrainer markiert.
              </p>
            </Alert>

            <div className="space-y-2 mb-4">
              {allTrainers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Keine Trainer verfügbar</p>
              ) : (
                allTrainers.map((trainer, index) => {
                  const isSelected = selectedTrainers.includes(trainer.id);
                  const selectionOrder = selectedTrainers.indexOf(trainer.id) + 1;
                  return (
                    <div
                      key={trainer.id}
                      onClick={() => toggleTrainerSelection(trainer.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {trainer.firstName} {trainer.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{trainer.email}</p>
                        </div>
                        {isSelected && (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-sm font-bold">
                            {selectionOrder}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTrainerModal(false);
                  setSelectedTrainers([]);
                }}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleAssignTrainers}
                disabled={selectedTrainers.length === 0 || selectedTrainers.length > 2}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Trainer zuweisen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
