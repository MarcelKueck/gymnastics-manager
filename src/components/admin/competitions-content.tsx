'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CompetitionForm } from '@/components/admin/competition-form';
import { CompetitionRegistrationsManager } from '@/components/admin/competition-registrations-manager';
import { AlertCircle, Plus, Calendar, MapPin, Users, Edit, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { YOUTH_CATEGORY_LABELS } from '@/lib/constants/statuses';

export function AdminCompetitionsContent() {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRegistrationsDialog, setShowRegistrationsDialog] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<any | null>(null);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      const response = await fetch('/api/admin/competitions');
      if (!response.ok) throw new Error('Fehler beim Laden der Wettkämpfe');

      const data = await response.json();
      setCompetitions(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (formData: any) => {
    try {
      const response = await fetch('/api/admin/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Erstellen');
      }

      toast.success('Wettkampf erfolgreich erstellt');
      setShowCreateDialog(false);
      fetchCompetitions();
    } catch (err) {
      throw err;
    }
  };

  const handleEdit = async (formData: any) => {
    if (!selectedCompetition) return;

    try {
      const response = await fetch(`/api/admin/competitions/${selectedCompetition.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Aktualisieren');
      }

      toast.success('Wettkampf erfolgreich aktualisiert');
      setShowEditDialog(false);
      setSelectedCompetition(null);
      fetchCompetitions();
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async (competitionId: string) => {
    if (!confirm('Möchtest du diesen Wettkampf wirklich löschen?')) return;

    try {
      const response = await fetch(`/api/admin/competitions/${competitionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Löschen');
      }

      toast.success('Wettkampf erfolgreich gelöscht');
      fetchCompetitions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Löschen');
    }
  };

  const handleManageRegistrations = (competition: any) => {
    setSelectedCompetition(competition);
    setShowRegistrationsDialog(true);
  };

  if (isLoading) return <Loading />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const upcomingCompetitions = competitions.filter(c => new Date(c.date) >= new Date());
  const pastCompetitions = competitions.filter(c => new Date(c.date) < new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Wettkämpfe verwalten</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Wettkampfveranstaltungen erstellen und Anmeldungen verwalten
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Neuer Wettkampf
        </Button>
      </div>

      {/* Upcoming Competitions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Bevorstehende Wettkämpfe</h2>
        {upcomingCompetitions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              Keine bevorstehenden Wettkämpfe
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingCompetitions.map((competition) => (
              <Card key={competition.id} className={competition.isCancelled ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{competition.name}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        {!competition.isPublished && <Badge variant="secondary">Entwurf</Badge>}
                        {competition.isCancelled && <Badge variant="destructive">Abgesagt</Badge>}
                        {competition.requiresDtbId && <Badge variant="outline">DTB-ID</Badge>}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(competition.date)}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2" />
                      {competition.location}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      {competition.registrations.length} Anmeldungen
                      {competition.maxParticipants && ` / ${competition.maxParticipants} max`}
                    </div>
                    {(competition.minYouthCategory || competition.maxYouthCategory) && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Kategorien: </span>
                        {competition.minYouthCategory && YOUTH_CATEGORY_LABELS[competition.minYouthCategory as keyof typeof YOUTH_CATEGORY_LABELS]}
                        {competition.minYouthCategory && competition.maxYouthCategory && ' - '}
                        {competition.maxYouthCategory && YOUTH_CATEGORY_LABELS[competition.maxYouthCategory as keyof typeof YOUTH_CATEGORY_LABELS]}
                      </div>
                    )}
                    {competition.entryFee && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Startgebühr: </span>
                        {Number(competition.entryFee).toFixed(2)} €
                      </div>
                    )}
                    {competition.registrationDeadline && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Anmeldeschluss: </span>
                        {formatDate(competition.registrationDeadline)}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManageRegistrations(competition)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Anmeldungen
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCompetition(competition);
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Bearbeiten
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(competition.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past Competitions */}
      {pastCompetitions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Vergangene Wettkämpfe</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pastCompetitions.map((competition) => (
              <Card key={competition.id} className="opacity-75">
                <CardHeader>
                  <CardTitle className="text-base">{competition.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(competition.date)}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      {competition.registrations.length} Teilnehmer
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageRegistrations(competition)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ergebnisse ansehen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neuer Wettkampf</DialogTitle>
          </DialogHeader>
          <CompetitionForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Wettkampf bearbeiten</DialogTitle>
          </DialogHeader>
          {selectedCompetition && (
            <CompetitionForm
              initialData={selectedCompetition}
              onSubmit={handleEdit}
              onCancel={() => {
                setShowEditDialog(false);
                setSelectedCompetition(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Registrations Manager Dialog */}
      <Dialog open={showRegistrationsDialog} onOpenChange={setShowRegistrationsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Anmeldungen verwalten</DialogTitle>
          </DialogHeader>
          {selectedCompetition && (
            <CompetitionRegistrationsManager
              competition={selectedCompetition}
              onUpdate={fetchCompetitions}
              onClose={() => setShowRegistrationsDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
