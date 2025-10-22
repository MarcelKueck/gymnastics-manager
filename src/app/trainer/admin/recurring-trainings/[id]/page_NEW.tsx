'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Users, 
  UserPlus, 
  X, 
  Save, 
  Plus,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  Calendar,
} from 'lucide-react';

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

interface TrainingGroup {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  athleteAssignments: Array<{
    athlete: Athlete;
  }>;
  trainerAssignments: Array<{
    trainer: Trainer;
    isPrimary: boolean;
  }>;
  _count: {
    athleteAssignments: number;
    trainerAssignments: number;
  };
}

interface RecurringTraining {
  id: string;
  name: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  groups: TrainingGroup[];
  _count: {
    groups: number;
    sessions: number;
  };
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
  const [groups, setGroups] = useState<TrainingGroup[]>([]);
  const [allAthletes, setAllAthletes] = useState<Athlete[]>([]);
  const [allTrainers, setAllTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showAthleteModal, setShowAthleteModal] = useState(false);
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<TrainingGroup | null>(null);
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>([]);

  // Group form state
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (id) {
      fetchTrainingDetail();
      fetchGroups();
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

  const fetchGroups = async () => {
    try {
      const response = await fetch(`/api/admin/recurring-trainings/${id}/groups`);
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data = await response.json();
      setGroups(data);
    } catch (err) {
      console.error('Error fetching groups:', err);
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

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim()) {
      setError('Gruppenname ist erforderlich');
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/admin/recurring-trainings/${id}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create group');
      }

      setSuccess('Gruppe erfolgreich erstellt!');
      setShowGroupModal(false);
      setGroupForm({ name: '', description: '' });
      await fetchGroups();
      await fetchTrainingDetail();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen der Gruppe');
      console.error(err);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Gruppe wirklich löschen? Dies ist nur möglich, wenn keine Athleten oder Trainer zugewiesen sind.')) return;

    try {
      setError(null);
      const response = await fetch(`/api/admin/recurring-trainings/${id}/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete group');
      }

      setSuccess('Gruppe erfolgreich gelöscht');
      await fetchGroups();
      await fetchTrainingDetail();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Löschen der Gruppe');
      console.error(err);
    }
  };

  const handleAssignAthletes = async () => {
    if (!selectedGroup) return;

    try {
      setError(null);
      const response = await fetch(`/api/admin/recurring-trainings/${id}/athletes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          athleteIds: selectedAthletes,
          trainingGroupId: selectedGroup.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to assign athletes');
      }

      setSuccess('Athleten erfolgreich zugewiesen!');
      setShowAthleteModal(false);
      setSelectedAthletes([]);
      setSelectedGroup(null);
      await fetchGroups();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Zuweisen der Athleten');
      console.error(err);
    }
  };

  const handleRemoveAthlete = async (groupId: string, athleteId: string) => {
    if (!confirm('Athlet wirklich aus dieser Gruppe entfernen?')) return;

    try {
      setError(null);
      const response = await fetch(
        `/api/admin/recurring-trainings/${id}/athletes?athleteId=${athleteId}&trainingGroupId=${groupId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to remove athlete');

      setSuccess('Athlet erfolgreich entfernt');
      await fetchGroups();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Fehler beim Entfernen des Athleten');
      console.error(err);
    }
  };

  const handleAssignTrainers = async () => {
    if (!selectedGroup) return;

    if (selectedTrainers.length === 0) {
      setError('Mindestens ein Trainer muss ausgewählt werden');
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/admin/recurring-trainings/${id}/trainers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          trainerIds: selectedTrainers,
          trainingGroupId: selectedGroup.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to assign trainers');

      setSuccess('Trainer erfolgreich zugewiesen!');
      setShowTrainerModal(false);
      setSelectedTrainers([]);
      setSelectedGroup(null);
      await fetchGroups();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Fehler beim Zuweisen der Trainer');
      console.error(err);
    }
  };

  const handleRemoveTrainer = async (groupId: string, trainerId: string) => {
    if (!confirm('Trainer wirklich aus dieser Gruppe entfernen?')) return;

    try {
      setError(null);
      const response = await fetch(
        `/api/admin/recurring-trainings/${id}/trainers?trainerId=${trainerId}&trainingGroupId=${groupId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to remove trainer');

      setSuccess('Trainer erfolgreich entfernt');
      await fetchGroups();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Fehler beim Entfernen des Trainers');
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

  const openAthleteModal = (group: TrainingGroup) => {
    setSelectedGroup(group);
    setSelectedAthletes([]);
    setShowAthleteModal(true);
  };

  const openTrainerModal = (group: TrainingGroup) => {
    setSelectedGroup(group);
    setSelectedTrainers([]);
    setShowTrainerModal(true);
  };

  // Filter available athletes (not assigned to any group of this training)
  const getAvailableAthletes = () => {
    const assignedAthleteIds = new Set(
      groups.flatMap(g => g.athleteAssignments.map(a => a.athlete.id))
    );
    return allAthletes.filter(athlete => !assignedAthleteIds.has(athlete.id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!training) {
    return (
      <Alert variant="error">Training nicht gefunden</Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{training.name}</h1>
          <p className="text-gray-600 mt-1">
            {dayTranslations[training.dayOfWeek]} • {training.startTime} - {training.endTime}
          </p>
        </div>
        <Button onClick={() => setShowGroupModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neue Gruppe
        </Button>
      </div>

      {/* Messages */}
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Groups */}
      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Keine Gruppen vorhanden
            </h3>
            <p className="text-gray-600 mb-4">
              Erstelle Gruppen um Athleten und Trainer zuzuweisen.
            </p>
            <Button onClick={() => setShowGroupModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Erste Gruppe erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{group.name}</CardTitle>
                    {group.description && (
                      <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteGroup(group.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Athletes */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">
                      Athleten ({group._count.athleteAssignments})
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAthleteModal(group)}
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Hinzufügen
                    </Button>
                  </div>
                  {group.athleteAssignments.length === 0 ? (
                    <p className="text-sm text-gray-500">Keine Athleten zugewiesen</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {group.athleteAssignments.map((assignment) => (
                        <div
                          key={assignment.athlete.id}
                          className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded text-sm"
                        >
                          <span>
                            {assignment.athlete.firstName} {assignment.athlete.lastName}
                          </span>
                          <button
                            onClick={() => handleRemoveAthlete(group.id, assignment.athlete.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Trainers */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">
                      Trainer ({group._count.trainerAssignments})
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openTrainerModal(group)}
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Hinzufügen
                    </Button>
                  </div>
                  {group.trainerAssignments.length === 0 ? (
                    <p className="text-sm text-gray-500">Keine Trainer zugewiesen</p>
                  ) : (
                    <div className="space-y-2">
                      {group.trainerAssignments.map((assignment) => (
                        <div
                          key={assignment.trainer.id}
                          className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded text-sm"
                        >
                          <span>
                            {assignment.trainer.firstName} {assignment.trainer.lastName}
                            {assignment.isPrimary && (
                              <span className="ml-2 text-xs text-orange-600 font-medium">
                                (Primär)
                              </span>
                            )}
                          </span>
                          <button
                            onClick={() => handleRemoveTrainer(group.id, assignment.trainer.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Neue Gruppe erstellen</h3>
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  setGroupForm({ name: '', description: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="groupName">Gruppenname *</Label>
                <Input
                  id="groupName"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="z.B. Anfänger, Wettkampf..."
                />
              </div>

              <div>
                <Label htmlFor="groupDescription">Beschreibung (optional)</Label>
                <Textarea
                  id="groupDescription"
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  placeholder="Beschreibung der Gruppe..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowGroupModal(false);
                  setGroupForm({ name: '', description: '' });
                }}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleCreateGroup}
                disabled={!groupForm.name.trim()}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Erstellen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Athletes Modal */}
      {showAthleteModal && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Athleten zu &ldquo;{selectedGroup.name}&rdquo; hinzufügen
              </h3>
              <button
                onClick={() => {
                  setShowAthleteModal(false);
                  setSelectedAthletes([]);
                  setSelectedGroup(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {getAvailableAthletes().length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Alle Athleten sind bereits Gruppen zugewiesen.
                </p>
              ) : (
                getAvailableAthletes().map((athlete) => (
                  <label
                    key={athlete.id}
                    className="flex items-center p-3 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAthletes.includes(athlete.id)}
                      onChange={() => toggleAthleteSelection(athlete.id)}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium">
                        {athlete.firstName} {athlete.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{athlete.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAthleteModal(false);
                  setSelectedAthletes([]);
                  setSelectedGroup(null);
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
                <UserPlus className="h-4 w-4 mr-2" />
                {selectedAthletes.length} Athlet(en) zuweisen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Trainers Modal */}
      {showTrainerModal && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Trainer zu &ldquo;{selectedGroup.name}&rdquo; hinzufügen
              </h3>
              <button
                onClick={() => {
                  setShowTrainerModal(false);
                  setSelectedTrainers([]);
                  setSelectedGroup(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {allTrainers.map((trainer) => (
                <label
                  key={trainer.id}
                  className="flex items-center p-3 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTrainers.includes(trainer.id)}
                    onChange={() => toggleTrainerSelection(trainer.id)}
                    className="mr-3"
                  />
                  <div>
                    <p className="font-medium">
                      {trainer.firstName} {trainer.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{trainer.email}</p>
                  </div>
                </label>
              ))}
            </div>

            <Alert variant="default" className="mb-4">
              <p className="text-sm">
                Der erste ausgewählte Trainer wird als primärer Trainer markiert.
              </p>
            </Alert>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTrainerModal(false);
                  setSelectedTrainers([]);
                  setSelectedGroup(null);
                }}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleAssignTrainers}
                disabled={selectedTrainers.length === 0}
                className="flex-1"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {selectedTrainers.length} Trainer zuweisen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
