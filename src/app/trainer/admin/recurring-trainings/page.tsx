'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Calendar,
  Users,
  Edit,
  Trash2,
  X,
  Clock,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface RecurringTraining {
  id: string;
  name: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  groupNumber: number;
  recurrenceInterval: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  athleteAssignments: Array<{
    athlete: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
  trainerAssignments: Array<{
    trainer: {
      id: string;
      firstName: string;
      lastName: string;
    };
    isPrimary: boolean;
  }>;
  _count: {
    athleteAssignments: number;
    trainerAssignments: number;
    sessions: number;
  };
}

const dayTranslations: Record<string, string> = {
  MONDAY: 'Montag',
  TUESDAY: 'Dienstag',
  WEDNESDAY: 'Mittwoch',
  THURSDAY: 'Donnerstag',
  FRIDAY: 'Freitag',
  SATURDAY: 'Samstag',
  SUNDAY: 'Sonntag',
};

const intervalTranslations: Record<string, string> = {
  WEEKLY: 'Wöchentlich',
  BIWEEKLY: 'Alle 2 Wochen',
  MONTHLY: 'Monatlich',
};

export default function AdminRecurringTrainingsPage() {
  const [trainings, setTrainings] = useState<RecurringTraining[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    dayOfWeek: 'MONDAY',
    startTime: '17:00',
    endTime: '18:30',
    groupNumber: 1,
    recurrenceInterval: 'WEEKLY',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
  });

  useEffect(() => {
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/recurring-trainings');
      if (!response.ok) throw new Error('Failed to fetch trainings');
      const data = await response.json();
      setTrainings(data.recurringTrainings);
    } catch (err) {
      setError('Fehler beim Laden der Trainings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/recurring-trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create training');

      setSuccess('Training erfolgreich erstellt!');
      setShowCreateModal(false);
      await fetchTrainings();
      resetForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Fehler beim Erstellen des Trainings');
      console.error(err);
    }
  };

  const handleGenerateSessions = async (trainingId: string) => {
    if (!confirm('Sessions für die nächsten 12 Wochen generieren?')) return;

    try {
      setGenerating(trainingId);
      setError(null);

      const response = await fetch(
        `/api/admin/recurring-trainings/${trainingId}/generate-sessions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weeksAhead: 12 }),
        }
      );

      if (!response.ok) throw new Error('Failed to generate sessions');

      const data = await response.json();
      setSuccess(data.message);
      await fetchTrainings();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Fehler beim Generieren der Sessions');
      console.error(err);
    } finally {
      setGenerating(null);
    }
  };

  const handleDelete = async (trainingId: string) => {
    if (
      !confirm(
        'Training wirklich löschen? Alle zugehörigen Sessions werden ebenfalls gelöscht!'
      )
    )
      return;

    try {
      setError(null);
      const response = await fetch(`/api/admin/recurring-trainings/${trainingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete training');

      setSuccess('Training erfolgreich gelöscht');
      await fetchTrainings();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Fehler beim Löschen des Trainings');
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      dayOfWeek: 'MONDAY',
      startTime: '17:00',
      endTime: '18:30',
      groupNumber: 1,
      recurrenceInterval: 'WEEKLY',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wiederkehrende Trainings</h1>
          <p className="text-gray-600 mt-1">
            Verwalte Trainingstermine, Gruppen und Übungsleiter
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neues Training
        </Button>
      </div>

      {/* Messages */}
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Training List */}
      {trainings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Keine Trainings vorhanden
            </h3>
            <p className="text-gray-600 mb-4">
              Erstelle dein erstes wiederkehrendes Training.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Training erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {trainings.map((training) => (
            <Card
              key={training.id}
              className={!training.isActive ? 'opacity-60 border-gray-300' : ''}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{training.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {dayTranslations[training.dayOfWeek]}
                    </p>
                  </div>
                  {!training.isActive && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Inaktiv
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Time and Group */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="h-4 w-4" />
                    <span>
                      {training.startTime} - {training.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Users className="h-4 w-4" />
                    <span>Gruppe {training.groupNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <RefreshCw className="h-4 w-4" />
                    <span>{intervalTranslations[training.recurrenceInterval]}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900">
                      {training._count.athleteAssignments}
                    </p>
                    <p className="text-xs text-gray-600">Athleten</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900">
                      {training._count.trainerAssignments}
                    </p>
                    <p className="text-xs text-gray-600">Trainer</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900">
                      {training._count.sessions}
                    </p>
                    <p className="text-xs text-gray-600">Sessions</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (window.location.href = `/trainer/admin/recurring-trainings/${training.id}`)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Bearbeiten
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateSessions(training.id)}
                    disabled={generating === training.id}
                    className="flex-1"
                  >
                    {generating === training.id ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Läuft...
                      </>
                    ) : (
                      <>
                        <Calendar className="h-3 w-3 mr-1" />
                        Sessions
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(training.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Neues wiederkehrendes Training
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Montag - 1. Stunde - Gruppe 1"
                />
              </div>

              {/* Day of Week */}
              <div>
                <Label htmlFor="dayOfWeek">Wochentag *</Label>
                <select
                  id="dayOfWeek"
                  value={formData.dayOfWeek}
                  onChange={(e) =>
                    setFormData({ ...formData, dayOfWeek: e.target.value })
                  }
                  className="w-full h-10 border border-gray-300 rounded-md px-3"
                >
                  {Object.entries(dayTranslations).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Startzeit *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">Endzeit *</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Group Number */}
              <div>
                <Label htmlFor="groupNumber">Gruppe *</Label>
                <select
                  id="groupNumber"
                  value={formData.groupNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, groupNumber: parseInt(e.target.value) })
                  }
                  className="w-full h-10 border border-gray-300 rounded-md px-3"
                >
                  <option value={1}>Gruppe 1</option>
                  <option value={2}>Gruppe 2</option>
                  <option value={3}>Gruppe 3</option>
                </select>
              </div>

              {/* Recurrence Interval */}
              <div>
                <Label htmlFor="recurrenceInterval">Wiederholung *</Label>
                <select
                  id="recurrenceInterval"
                  value={formData.recurrenceInterval}
                  onChange={(e) =>
                    setFormData({ ...formData, recurrenceInterval: e.target.value })
                  }
                  className="w-full h-10 border border-gray-300 rounded-md px-3"
                >
                  {Object.entries(intervalTranslations).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Startdatum *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Enddatum (optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <Alert variant="default">
                <p className="text-sm">
                  Nach dem Erstellen kannst du Athleten und Trainer zuweisen und
                  Sessions generieren.
                </p>
              </Alert>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!formData.name || !formData.startDate}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Erstellen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
