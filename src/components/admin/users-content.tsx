'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  User,
  Shield,
  Users as UsersIcon,
  UserPlus,
  Edit,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { TrainerGroupsEditor } from '@/components/admin/trainer-groups-editor';
import { YouthCategory } from '@prisma/client';
import { YOUTH_CATEGORY_LABELS } from '@/lib/constants/statuses';

interface Athlete {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  phone: string;
  isApproved: boolean;
  createdAt: string;
  guardianName?: string;
  guardianEmail?: string;
  guardianPhone?: string;
  youthCategory?: YouthCategory;
  competitionParticipation?: boolean;
  hasDtbId?: boolean;
  _count: {
    attendanceRecords: number;
    cancellations: number;
    absenceAlerts: number;
  };
}

interface TrainingGroup {
  id: string;
  name: string;
  recurringTraining: {
    name: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  };
}

interface Trainer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'TRAINER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
}

export function AdminUsersContent() {
  // State
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [pendingAthletes, setPendingAthletes] = useState<Athlete[]>([]);
  const [availableGroups, setAvailableGroups] = useState<TrainingGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all-athletes');

  // Dialog states
  const [isCreateAthleteDialogOpen, setIsCreateAthleteDialogOpen] = useState(false);
  const [isCreateTrainerDialogOpen, setIsCreateTrainerDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showGroupsEditor, setShowGroupsEditor] = useState(false);
  const [selectedTrainerForGroups, setSelectedTrainerForGroups] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedAthleteForApproval, setSelectedAthleteForApproval] = useState<Athlete | null>(
    null
  );
  const [approvalConfig, setApprovalConfig] = useState<{
    youthCategory: YouthCategory;
    competitionParticipation: boolean;
    hasDtbId: boolean;
    selectedGroups: string[];
  }>({
    youthCategory: YouthCategory.F,
    competitionParticipation: false,
    hasDtbId: false,
    selectedGroups: [],
  });
  const [showAthleteGroupsEditor, setShowAthleteGroupsEditor] = useState(false);
  const [selectedAthleteForGroups, setSelectedAthleteForGroups] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isEditAthleteDialogOpen, setIsEditAthleteDialogOpen] = useState(false);
  const [selectedAthleteForEdit, setSelectedAthleteForEdit] = useState<Athlete | null>(null);
  const [editAthleteFormData, setEditAthleteFormData] = useState<{
    firstName: string;
    lastName: string;
    birthDate: string;
    phone: string;
    youthCategory: YouthCategory;
    competitionParticipation: boolean;
    hasDtbId: boolean;
  }>({
    firstName: '',
    lastName: '',
    birthDate: '',
    phone: '',
    youthCategory: YouthCategory.F,
    competitionParticipation: false,
    hasDtbId: false,
  });
  const [isEditTrainerDialogOpen, setIsEditTrainerDialogOpen] = useState(false);
  const [selectedTrainerForEdit, setSelectedTrainerForEdit] = useState<Trainer | null>(null);
  const [editTrainerFormData, setEditTrainerFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    role: 'TRAINER' as 'TRAINER' | 'ADMIN',
  });

  // Form data
  const [athleteFormData, setAthleteFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    phone: '',
    guardianName: '',
    guardianEmail: '',
    guardianPhone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  const [trainerFormData, setTrainerFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'TRAINER' as 'TRAINER' | 'ADMIN',
  });

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    setIsLoading(true);
    try {
      const [athletesRes, trainersRes, groupsRes] = await Promise.all([
        fetch('/api/admin/athletes'),
        fetch('/api/admin/trainers'),
        fetch('/api/admin/groups'),
      ]);

      if (athletesRes.ok) {
        const data = await athletesRes.json();
        // Separate approved and pending athletes
        const approved = data.data.filter((a: Athlete) => a.isApproved);
        const pending = data.data.filter((a: Athlete) => !a.isApproved);
        setAthletes(approved);
        setPendingAthletes(pending);
      }

      if (trainersRes.ok) {
        const data = await trainersRes.json();
        setTrainers(data.data);
      }

      if (groupsRes.ok) {
        const data = await groupsRes.json();
        setAvailableGroups(data.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Benutzer');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Athlete operations
  const handleCreateAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');

    try {
      const response = await fetch('/api/admin/athletes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(athleteFormData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Erstellen');
      }

      toast.success('Athlet erfolgreich erstellt');
      setIsCreateAthleteDialogOpen(false);
      setAthleteFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        birthDate: '',
        gender: 'MALE',
        phone: '',
        guardianName: '',
        guardianEmail: '',
        guardianPhone: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
      });
      fetchAllUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteAthlete = async (athleteId: string, athleteName: string) => {
    if (
      !confirm(
        `ACHTUNG: Möchtest du ${athleteName} wirklich komplett aus dem System entfernen?\n\nDies wird:\n- Den Athleten-Account löschen\n- Alle Trainingszuweisungen entfernen\n- Alle Anwesenheitsaufzeichnungen löschen\n- Eine Benachrichtigungs-E-Mail senden\n\nDieser Vorgang kann nicht rückgängig gemacht werden!`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/athletes/${athleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Löschen');
      }

      toast.success(`${athleteName} wurde erfolgreich entfernt und benachrichtigt`);
      fetchAllUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    }
  };

  const handleOpenApprovalModal = (athlete: Athlete) => {
    setSelectedAthleteForApproval(athlete);
    setApprovalConfig({
      youthCategory: YouthCategory.F,
      competitionParticipation: false,
      hasDtbId: false,
      selectedGroups: [],
    });
    setShowApprovalModal(true);
  };

  const handleApproveAthlete = async () => {
    if (!selectedAthleteForApproval) return;

    if (approvalConfig.selectedGroups.length === 0) {
      toast.error('Bitte mindestens eine Trainingsgruppe auswählen');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`/api/trainer/athletes/${selectedAthleteForApproval.id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youthCategory: approvalConfig.youthCategory,
          competitionParticipation: approvalConfig.competitionParticipation,
          hasDtbId: approvalConfig.hasDtbId,
          trainingGroupIds: approvalConfig.selectedGroups,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Genehmigen');
      }

      toast.success(
        `${selectedAthleteForApproval.firstName} ${selectedAthleteForApproval.lastName} wurde genehmigt`
      );
      setShowApprovalModal(false);
      setSelectedAthleteForApproval(null);
      fetchAllUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRejectAthlete = async (athleteId: string, athleteName: string) => {
    if (!confirm(`Möchtest du die Registrierung von ${athleteName} wirklich ablehnen?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/trainer/athletes/${athleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Ablehnen');
      }

      toast.success(`${athleteName} wurde abgelehnt und gelöscht`);
      fetchAllUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    }
  };

  const toggleGroup = (groupId: string) => {
    setApprovalConfig((prev) => ({
      ...prev,
      selectedGroups: prev.selectedGroups.includes(groupId)
        ? prev.selectedGroups.filter((id) => id !== groupId)
        : [...prev.selectedGroups, groupId],
    }));
  };

  const handleOpenEditAthleteModal = (athlete: Athlete) => {
    setSelectedAthleteForEdit(athlete);
    setEditAthleteFormData({
      firstName: athlete.firstName,
      lastName: athlete.lastName,
      birthDate: athlete.birthDate.split('T')[0],
      phone: athlete.phone,
      youthCategory: athlete.youthCategory || YouthCategory.F,
      competitionParticipation: athlete.competitionParticipation || false,
      hasDtbId: athlete.hasDtbId || false,
    });
    setIsEditAthleteDialogOpen(true);
  };

  const handleEditAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthleteForEdit) return;

    setIsCreating(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/athletes/${selectedAthleteForEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editAthleteFormData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Aktualisieren');
      }

      toast.success('Athlet erfolgreich aktualisiert');
      setIsEditAthleteDialogOpen(false);
      setSelectedAthleteForEdit(null);
      fetchAllUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleAthleteActive = async (athleteId: string, isApproved: boolean) => {
    try {
      const response = await fetch(`/api/admin/athletes/${athleteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: !isApproved }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Aktualisieren');
      }

      toast.success(isApproved ? 'Athlet deaktiviert' : 'Athlet aktiviert');
      fetchAllUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    }
  };

  // Trainer operations
  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');

    try {
      const response = await fetch('/api/admin/trainers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trainerFormData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Erstellen');
      }

      toast.success('Trainer erfolgreich erstellt');
      setIsCreateTrainerDialogOpen(false);
      setTrainerFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'TRAINER',
      });
      fetchAllUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleTrainerActive = async (trainerId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/trainers/${trainerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Aktualisieren');
      }

      toast.success(isActive ? 'Trainer deaktiviert' : 'Trainer aktiviert');
      fetchAllUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    }
  };

  const handleDeleteTrainer = async (trainerId: string, trainerName: string) => {
    if (!confirm(`Möchtest du ${trainerName} wirklich löschen?`)) return;

    try {
      const response = await fetch(`/api/admin/trainers/${trainerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Löschen');
      }

      toast.success('Trainer gelöscht');
      fetchAllUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    }
  };

  const handleOpenEditTrainerModal = (trainer: Trainer) => {
    setSelectedTrainerForEdit(trainer);
    setEditTrainerFormData({
      firstName: trainer.firstName,
      lastName: trainer.lastName,
      phone: trainer.phone,
      role: trainer.role,
    });
    setIsEditTrainerDialogOpen(true);
  };

  const handleEditTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainerForEdit) return;

    setIsCreating(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/trainers/${selectedTrainerForEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editTrainerFormData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Aktualisieren');
      }

      toast.success('Trainer erfolgreich aktualisiert');
      setIsEditTrainerDialogOpen(false);
      setSelectedTrainerForEdit(null);
      fetchAllUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) return <Loading />;

  if (error && athletes.length === 0 && trainers.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Benutzer verwalten</h1>
        <p className="text-muted-foreground">
          Verwalte alle Athleten, Trainer und Registrierungsanfragen
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all-athletes">
            <User className="h-4 w-4 mr-2" />
            Athleten ({athletes.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            <AlertCircle className="h-4 w-4 mr-2" />
            Ausstehend
            {pendingAthletes.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingAthletes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="trainers">
            <Shield className="h-4 w-4 mr-2" />
            Trainer ({trainers.length})
          </TabsTrigger>
        </TabsList>

        {/* Athletes Tab */}
        <TabsContent value="all-athletes" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isCreateAthleteDialogOpen} onOpenChange={setIsCreateAthleteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Athlet hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Neuen Athleten erstellen</DialogTitle>
                  <DialogDescription>
                    Erstelle einen neuen Athleten-Account. Der Athlet wird automatisch genehmigt.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAthlete} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4">
                    <h3 className="font-medium">Persönliche Daten</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Vorname *</Label>
                        <Input
                          id="firstName"
                          value={athleteFormData.firstName}
                          onChange={(e) =>
                            setAthleteFormData({ ...athleteFormData, firstName: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nachname *</Label>
                        <Input
                          id="lastName"
                          value={athleteFormData.lastName}
                          onChange={(e) =>
                            setAthleteFormData({ ...athleteFormData, lastName: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="birthDate">Geburtsdatum *</Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={athleteFormData.birthDate}
                          onChange={(e) =>
                            setAthleteFormData({ ...athleteFormData, birthDate: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Geschlecht *</Label>
                        <select
                          id="gender"
                          value={athleteFormData.gender}
                          onChange={(e) =>
                            setAthleteFormData({
                              ...athleteFormData,
                              gender: e.target.value as any,
                            })
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          required
                        >
                          <option value="MALE">Männlich</option>
                          <option value="FEMALE">Weiblich</option>
                          <option value="OTHER">Divers</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-Mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={athleteFormData.email}
                        onChange={(e) =>
                          setAthleteFormData({ ...athleteFormData, email: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={athleteFormData.phone}
                        onChange={(e) =>
                          setAthleteFormData({ ...athleteFormData, phone: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Passwort *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={athleteFormData.password}
                        onChange={(e) =>
                          setAthleteFormData({ ...athleteFormData, password: e.target.value })
                        }
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Erziehungsberechtigte (optional)</h3>
                    <div className="space-y-2">
                      <Label htmlFor="guardianName">Name</Label>
                      <Input
                        id="guardianName"
                        value={athleteFormData.guardianName}
                        onChange={(e) =>
                          setAthleteFormData({ ...athleteFormData, guardianName: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="guardianEmail">E-Mail</Label>
                        <Input
                          id="guardianEmail"
                          type="email"
                          value={athleteFormData.guardianEmail}
                          onChange={(e) =>
                            setAthleteFormData({
                              ...athleteFormData,
                              guardianEmail: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guardianPhone">Telefon</Label>
                        <Input
                          id="guardianPhone"
                          type="tel"
                          value={athleteFormData.guardianPhone}
                          onChange={(e) =>
                            setAthleteFormData({
                              ...athleteFormData,
                              guardianPhone: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Notfallkontakt (optional)</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactName">Name</Label>
                        <Input
                          id="emergencyContactName"
                          value={athleteFormData.emergencyContactName}
                          onChange={(e) =>
                            setAthleteFormData({
                              ...athleteFormData,
                              emergencyContactName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContactPhone">Telefon</Label>
                        <Input
                          id="emergencyContactPhone"
                          type="tel"
                          value={athleteFormData.emergencyContactPhone}
                          onChange={(e) =>
                            setAthleteFormData({
                              ...athleteFormData,
                              emergencyContactPhone: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateAthleteDialogOpen(false)}
                    >
                      Abbrechen
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? 'Erstellen...' : 'Erstellen'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {athletes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                Keine Athleten gefunden
              </CardContent>
            </Card>
          ) : (
            athletes.map((athlete) => (
              <Card key={athlete.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">
                            {athlete.firstName} {athlete.lastName}
                          </h3>
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Genehmigt
                          </Badge>
                          {athlete._count.absenceAlerts > 0 && (
                            <Badge variant="destructive">
                              {athlete._count.absenceAlerts} Fehlzeiten-Warnung
                              {athlete._count.absenceAlerts > 1 ? 'en' : ''}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{athlete.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {calculateAge(athlete.birthDate)} Jahre • {athlete.phone} • Mitglied seit{' '}
                          {formatDate(athlete.createdAt)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {athlete._count.attendanceRecords} Anwesenheiten •{' '}
                          {athlete._count.cancellations} Absagen
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditAthleteModal(athlete)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Bearbeiten
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAthleteForGroups({
                            id: athlete.id,
                            name: `${athlete.firstName} ${athlete.lastName}`,
                          });
                          setShowAthleteGroupsEditor(true);
                        }}
                      >
                        <UsersIcon className="h-4 w-4 mr-1" />
                        Gruppen
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleAthleteActive(athlete.id, athlete.isApproved)}
                      >
                        {athlete.isApproved ? 'Deaktivieren' : 'Aktivieren'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          handleDeleteAthlete(
                            athlete.id,
                            `${athlete.firstName} ${athlete.lastName}`
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Pending Athletes Tab */}
        <TabsContent value="pending" className="space-y-4">
          {pendingAthletes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>Keine ausstehenden Registrierungen</p>
              </CardContent>
            </Card>
          ) : (
            pendingAthletes.map((athlete) => (
              <Card key={athlete.id} className="border-l-4 border-l-yellow-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-yellow-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">
                            {athlete.firstName} {athlete.lastName}
                          </h3>
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Ausstehend
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{athlete.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {calculateAge(athlete.birthDate)} Jahre • {athlete.phone} • Registriert am{' '}
                          {formatDate(athlete.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleOpenApprovalModal(athlete)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Konfigurieren & Genehmigen
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          handleRejectAthlete(
                            athlete.id,
                            `${athlete.firstName} ${athlete.lastName}`
                          )
                        }
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Ablehnen
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Trainers Tab */}
        <TabsContent value="trainers" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isCreateTrainerDialogOpen} onOpenChange={setIsCreateTrainerDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Trainer hinzufügen
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neuen Trainer erstellen</DialogTitle>
                  <DialogDescription>
                    Erstelle einen neuen Trainer oder Administrator
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTrainer} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="trainerFirstName">Vorname *</Label>
                      <Input
                        id="trainerFirstName"
                        value={trainerFormData.firstName}
                        onChange={(e) =>
                          setTrainerFormData({ ...trainerFormData, firstName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trainerLastName">Nachname *</Label>
                      <Input
                        id="trainerLastName"
                        value={trainerFormData.lastName}
                        onChange={(e) =>
                          setTrainerFormData({ ...trainerFormData, lastName: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trainerEmail">E-Mail *</Label>
                    <Input
                      id="trainerEmail"
                      type="email"
                      value={trainerFormData.email}
                      onChange={(e) =>
                        setTrainerFormData({ ...trainerFormData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trainerPhone">Telefon</Label>
                    <Input
                      id="trainerPhone"
                      type="tel"
                      value={trainerFormData.phone}
                      onChange={(e) =>
                        setTrainerFormData({ ...trainerFormData, phone: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trainerPassword">Passwort *</Label>
                    <Input
                      id="trainerPassword"
                      type="password"
                      value={trainerFormData.password}
                      onChange={(e) =>
                        setTrainerFormData({ ...trainerFormData, password: e.target.value })
                      }
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trainerRole">Rolle *</Label>
                    <select
                      id="trainerRole"
                      value={trainerFormData.role}
                      onChange={(e) =>
                        setTrainerFormData({
                          ...trainerFormData,
                          role: e.target.value as 'TRAINER' | 'ADMIN',
                        })
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="TRAINER">Trainer</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateTrainerDialogOpen(false)}
                    >
                      Abbrechen
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? 'Erstellen...' : 'Erstellen'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {trainers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                Keine Trainer gefunden
              </CardContent>
            </Card>
          ) : (
            trainers.map((trainer) => (
              <Card key={trainer.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        {trainer.role === 'ADMIN' ? (
                          <Shield className="h-6 w-6 text-primary" />
                        ) : (
                          <User className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">
                            {trainer.firstName} {trainer.lastName}
                          </h3>
                          <Badge variant={trainer.role === 'ADMIN' ? 'default' : 'secondary'}>
                            {trainer.role === 'ADMIN' ? 'Administrator' : 'Trainer'}
                          </Badge>
                          <Badge variant={trainer.isActive ? 'default' : 'secondary'}>
                            {trainer.isActive ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{trainer.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {trainer.phone && `${trainer.phone} • `}
                          Mitglied seit {formatDate(trainer.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditTrainerModal(trainer)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Bearbeiten
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTrainerForGroups({
                            id: trainer.id,
                            name: `${trainer.firstName} ${trainer.lastName}`,
                          });
                          setShowGroupsEditor(true);
                        }}
                      >
                        <UsersIcon className="h-4 w-4 mr-1" />
                        Gruppen
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleTrainerActive(trainer.id, trainer.isActive)}
                      >
                        {trainer.isActive ? 'Deaktivieren' : 'Aktivieren'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          handleDeleteTrainer(trainer.id, `${trainer.firstName} ${trainer.lastName}`)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Athlete Approval Modal */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Athleten genehmigen und konfigurieren</DialogTitle>
            <DialogDescription>
              Konfiguriere die Trainingseinstellungen und weise Gruppen zu
            </DialogDescription>
          </DialogHeader>

          {selectedAthleteForApproval && (
            <div className="space-y-6">
              {/* Athlete Info */}
              <Card>
                <CardContent className="pt-6 space-y-2 text-sm">
                  <div>
                    <strong>Name:</strong> {selectedAthleteForApproval.firstName}{' '}
                    {selectedAthleteForApproval.lastName}
                  </div>
                  <div>
                    <strong>Email:</strong> {selectedAthleteForApproval.email}
                  </div>
                  <div>
                    <strong>Geburtsdatum:</strong>{' '}
                    {new Date(selectedAthleteForApproval.birthDate).toLocaleDateString('de-DE')}
                  </div>
                  <div>
                    <strong>Telefon:</strong> {selectedAthleteForApproval.phone}
                  </div>
                  {selectedAthleteForApproval.guardianName && (
                    <div>
                      <strong>Erziehungsberechtigter:</strong>{' '}
                      {selectedAthleteForApproval.guardianName}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Training Configuration */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="youthCategory">Jugendkategorie</Label>
                  <select
                    id="youthCategory"
                    value={approvalConfig.youthCategory}
                    onChange={(e) =>
                      setApprovalConfig({
                        ...approvalConfig,
                        youthCategory: e.target.value as YouthCategory,
                      })
                    }
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {Object.values(YouthCategory).map((cat) => (
                      <option key={cat} value={cat}>
                        {YOUTH_CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="competition"
                    checked={approvalConfig.competitionParticipation}
                    onChange={(e) =>
                      setApprovalConfig({
                        ...approvalConfig,
                        competitionParticipation: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="competition" className="cursor-pointer">
                    Wettkampfteilnahme
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="dtbId"
                    checked={approvalConfig.hasDtbId}
                    onChange={(e) =>
                      setApprovalConfig({ ...approvalConfig, hasDtbId: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="dtbId" className="cursor-pointer">
                    DTB-ID vorhanden
                  </Label>
                </div>
              </div>

              {/* Training Groups */}
              <div>
                <Label>Trainingsgruppen auswählen (mindestens eine)</Label>
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                  {availableGroups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Keine Gruppen verfügbar</p>
                  ) : (
                    availableGroups.map((group) => (
                      <div key={group.id} className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          id={`group-${group.id}`}
                          checked={approvalConfig.selectedGroups.includes(group.id)}
                          onChange={() => toggleGroup(group.id)}
                          className="mt-1 h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor={`group-${group.id}`} className="flex-1 cursor-pointer">
                          <div className="font-medium">{group.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {group.recurringTraining.name} - {group.recurringTraining.dayOfWeek},{' '}
                            {group.recurringTraining.startTime} bis{' '}
                            {group.recurringTraining.endTime}
                          </div>
                        </label>
                      </div>
                    ))
                  )}
                </div>
                {approvalConfig.selectedGroups.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">Keine Gruppen ausgewählt</p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowApprovalModal(false)}
                  disabled={isCreating}
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleApproveAthlete}
                  disabled={isCreating || approvalConfig.selectedGroups.length === 0}
                >
                  {isCreating ? 'Wird genehmigt...' : 'Genehmigen'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Trainer Dialog */}
      <Dialog open={isEditTrainerDialogOpen} onOpenChange={setIsEditTrainerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trainer bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeite die Daten von {selectedTrainerForEdit?.firstName}{' '}
              {selectedTrainerForEdit?.lastName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditTrainer} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editTrainerFirstName">Vorname *</Label>
                <Input
                  id="editTrainerFirstName"
                  value={editTrainerFormData.firstName}
                  onChange={(e) =>
                    setEditTrainerFormData({ ...editTrainerFormData, firstName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editTrainerLastName">Nachname *</Label>
                <Input
                  id="editTrainerLastName"
                  value={editTrainerFormData.lastName}
                  onChange={(e) =>
                    setEditTrainerFormData({ ...editTrainerFormData, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editTrainerPhone">Telefon</Label>
              <Input
                id="editTrainerPhone"
                type="tel"
                value={editTrainerFormData.phone}
                onChange={(e) =>
                  setEditTrainerFormData({ ...editTrainerFormData, phone: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editTrainerRole">Rolle *</Label>
              <select
                id="editTrainerRole"
                value={editTrainerFormData.role}
                onChange={(e) =>
                  setEditTrainerFormData({
                    ...editTrainerFormData,
                    role: e.target.value as 'TRAINER' | 'ADMIN',
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="TRAINER">Trainer</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditTrainerDialogOpen(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Speichern...' : 'Speichern'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Athlete Dialog */}
      <Dialog open={isEditAthleteDialogOpen} onOpenChange={setIsEditAthleteDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Athlet bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeite die Daten von {selectedAthleteForEdit?.firstName}{' '}
              {selectedAthleteForEdit?.lastName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditAthlete} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">Vorname *</Label>
                <Input
                  id="editFirstName"
                  value={editAthleteFormData.firstName}
                  onChange={(e) =>
                    setEditAthleteFormData({ ...editAthleteFormData, firstName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Nachname *</Label>
                <Input
                  id="editLastName"
                  value={editAthleteFormData.lastName}
                  onChange={(e) =>
                    setEditAthleteFormData({ ...editAthleteFormData, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editBirthDate">Geburtsdatum *</Label>
                <Input
                  id="editBirthDate"
                  type="date"
                  value={editAthleteFormData.birthDate}
                  onChange={(e) =>
                    setEditAthleteFormData({ ...editAthleteFormData, birthDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone">Telefon *</Label>
                <Input
                  id="editPhone"
                  type="tel"
                  value={editAthleteFormData.phone}
                  onChange={(e) =>
                    setEditAthleteFormData({ ...editAthleteFormData, phone: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editYouthCategory">Jugendkategorie</Label>
              <select
                id="editYouthCategory"
                value={editAthleteFormData.youthCategory}
                onChange={(e) =>
                  setEditAthleteFormData({
                    ...editAthleteFormData,
                    youthCategory: e.target.value as YouthCategory,
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {Object.values(YouthCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {YOUTH_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editCompetition"
                  checked={editAthleteFormData.competitionParticipation}
                  onChange={(e) =>
                    setEditAthleteFormData({
                      ...editAthleteFormData,
                      competitionParticipation: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="editCompetition" className="cursor-pointer">
                  Wettkampfteilnahme
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="editDtbId"
                  checked={editAthleteFormData.hasDtbId}
                  onChange={(e) =>
                    setEditAthleteFormData({ ...editAthleteFormData, hasDtbId: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="editDtbId" className="cursor-pointer">
                  DTB-ID vorhanden
                </Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditAthleteDialogOpen(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Speichern...' : 'Speichern'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Trainer Groups Editor Dialog */}
      {selectedTrainerForGroups && (
        <TrainerGroupsEditor
          trainerId={selectedTrainerForGroups.id}
          trainerName={selectedTrainerForGroups.name}
          open={showGroupsEditor}
          onOpenChange={setShowGroupsEditor}
          onSave={fetchAllUsers}
        />
      )}

      {/* Athlete Groups Editor Dialog */}
      {selectedAthleteForGroups && (
        <TrainerGroupsEditor
          trainerId={selectedAthleteForGroups.id}
          trainerName={selectedAthleteForGroups.name}
          open={showAthleteGroupsEditor}
          onOpenChange={setShowAthleteGroupsEditor}
          onSave={fetchAllUsers}
        />
      )}
    </div>
  );
}
