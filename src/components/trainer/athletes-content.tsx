'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Search, UserCheck, Users, Edit } from 'lucide-react';
import { AthleteApprovalModal } from '@/components/trainer/athlete-approval-modal';
import { AthleteGroupsEditor } from '@/components/admin/athlete-groups-editor';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { YOUTH_CATEGORY_LABELS } from '@/lib/constants/statuses';
import { YouthCategory } from '@prisma/client';

export function TrainerAthletesContent() {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [pendingAthletes, setPendingAthletes] = useState<any[]>([]);
  const [trainingGroups, setTrainingGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('approved');
  const [selectedAthlete, setSelectedAthlete] = useState<any | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showGroupsEditor, setShowGroupsEditor] = useState(false);

  useEffect(() => {
    fetchAthletes();
    fetchPendingAthletes();
    fetchTrainingGroups();
  }, []);

  useEffect(() => {
    fetchAthletes();
  }, [searchQuery, statusFilter]);

  const fetchAthletes = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      params.append('status', statusFilter);

      const response = await fetch(`/api/trainer/athletes?${params.toString()}`);
      if (!response.ok) throw new Error('Fehler beim Laden der Athleten');

      const data = await response.json();
      setAthletes(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingAthletes = async () => {
    try {
      const response = await fetch('/api/trainer/athletes/pending');
      if (!response.ok) throw new Error('Fehler beim Laden');

      const data = await response.json();
      setPendingAthletes(data.data);
    } catch (err) {
      console.error('Error fetching pending athletes:', err);
    }
  };

  const fetchTrainingGroups = async () => {
    try {
      const response = await fetch('/api/admin/trainings');
      if (!response.ok) throw new Error('Fehler beim Laden der Gruppen');

      const data = await response.json();
      
      // Flatten all groups from all trainings
      const allGroups = data.data.flatMap((training: any) =>
        training.groups.map((group: any) => ({
          id: group.id,
          name: group.name,
          recurringTraining: {
            id: training.id,
            name: training.name,
            dayOfWeek: training.dayOfWeek,
            startTime: training.startTime,
            endTime: training.endTime,
          },
        }))
      );
      
      setTrainingGroups(allGroups);
    } catch (err) {
      console.error('Error fetching training groups:', err);
    }
  };

  const handleApprove = (athlete: any) => {
    setSelectedAthlete(athlete);
    setShowApprovalModal(true);
  };

  const handleSubmitApproval = async (config: {
    youthCategory: YouthCategory;
    competitionParticipation: boolean;
    hasDtbId: boolean;
    trainingGroupIds: string[];
  }) => {
    if (!selectedAthlete) return;

    try {
      const response = await fetch(`/api/trainer/athletes/${selectedAthlete.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Genehmigen');
      }

      toast.success('Athlet erfolgreich genehmigt');
      setShowApprovalModal(false);
      setSelectedAthlete(null);
      fetchAthletes();
      fetchPendingAthletes();
    } catch (err) {
      throw err; // Let the modal handle the error
    }
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Athletenverwaltung</h1>
        <p className="text-muted-foreground">Verwalte Athleten und Genehmigungen</p>
      </div>

      {/* Pending Approvals */}
      {pendingAthletes.length > 0 && (
        <Alert>
          <UserCheck className="h-4 w-4" />
          <AlertDescription>
            <strong>{pendingAthletes.length}</strong> Athleten warten auf Genehmigung.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Athleten suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Alle</option>
              <option value="approved">Genehmigt</option>
              <option value="pending">Ausstehend</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Pending Athletes */}
      {pendingAthletes.length > 0 && (statusFilter === 'all' || statusFilter === 'pending') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCheck className="h-5 w-5 mr-2" />
              Ausstehende Genehmigungen ({pendingAthletes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingAthletes.map((athlete) => (
                <div
                  key={athlete.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium">
                        {athlete.firstName} {athlete.lastName}
                      </h4>
                      <Badge variant="warning">Ausstehend</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {athlete.email} • Geboren: {formatDate(athlete.birthDate)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Registriert: {formatDate(athlete.createdAt)}
                    </p>
                  </div>
                  <Button onClick={() => handleApprove(athlete)} size="sm">
                    Genehmigen
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Athletes List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Athleten ({athletes.filter((a) => a.isApproved).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {athletes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Keine Athleten gefunden
            </p>
          ) : (
            <div className="space-y-3">
              {athletes.map((athlete) => (
                <div
                  key={athlete.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium">
                        {athlete.firstName} {athlete.lastName}
                      </h4>
                      {!athlete.isApproved && <Badge variant="warning">Ausstehend</Badge>}
                      {athlete.youthCategory && (
                        <Badge variant="outline">
                          {
                            YOUTH_CATEGORY_LABELS[
                              athlete.youthCategory as keyof typeof YOUTH_CATEGORY_LABELS
                            ]
                          }
                        </Badge>
                      )}
                      {athlete.competitionParticipation && (
                        <Badge variant="secondary">Wettkampf</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {athlete.email} • {formatDate(athlete.birthDate)}
                    </p>
                    {athlete.recurringTrainingAssignments?.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {athlete.recurringTrainingAssignments.length} Trainingsgruppe
                        {athlete.recurringTrainingAssignments.length !== 1 ? 'n' : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {athlete.isApproved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAthlete(athlete);
                          setShowGroupsEditor(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Gruppen bearbeiten
                      </Button>
                    )}
                    {!athlete.isApproved && (
                      <Button onClick={() => handleApprove(athlete)} size="sm">
                        Genehmigen
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Modal */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Athlet genehmigen</DialogTitle>
          </DialogHeader>
          {selectedAthlete && (
            <AthleteApprovalModal
              athlete={selectedAthlete}
              availableGroups={trainingGroups}
              onApprove={handleSubmitApproval}
              onCancel={() => {
                setShowApprovalModal(false);
                setSelectedAthlete(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Groups Editor Modal */}
      <Dialog open={showGroupsEditor} onOpenChange={setShowGroupsEditor}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trainingsgruppen bearbeiten</DialogTitle>
          </DialogHeader>
          {selectedAthlete && (
            <AthleteGroupsEditor
              athleteId={selectedAthlete.id}
              athleteName={`${selectedAthlete.firstName} ${selectedAthlete.lastName}`}
              currentGroupIds={
                selectedAthlete.recurringTrainingAssignments?.map(
                  (assignment: any) => assignment.trainingGroupId
                ) || []
              }
              onUpdate={() => {
                setShowGroupsEditor(false);
                setSelectedAthlete(null);
                fetchAthletes();
              }}
              onCancel={() => {
                setShowGroupsEditor(false);
                setSelectedAthlete(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}