'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import {
  User,
  Calendar,
  Phone,
  Mail,
  AlertCircle,
  Edit,
  ArrowLeft,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import EditConfigModal from '@/components/trainer/edit-config-modal-new';

interface AthleteDetail {
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
  youthCategory: string;
  competitionParticipation: boolean;
  hasDtbId: boolean;
  approvedAt: string;
  configuredAt: string;
  groupAssignments: Array<{
    id: string;
    trainingId: string;
    trainingName: string;
    groupId: string;
    groupName: string;
    trainingDay: string;
    startTime: string;
    endTime: string;
  }>;
  attendanceStats: {
    totalSessions: number;
    attended: number;
    attendancePercentage: number;
    excusedAbsences: number;
    unexcusedAbsences: number;
  };
}

const dayTranslations: Record<string, string> = {
  MONDAY: 'Montag',
  THURSDAY: 'Donnerstag',
  FRIDAY: 'Freitag',
};

const genderTranslations: Record<string, string> = {
  MALE: 'Männlich',
  FEMALE: 'Weiblich',
  OTHER: 'Divers',
};

export default function AthleteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const athleteId = params.id as string;

  const [athlete, setAthlete] = useState<AthleteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchAthleteDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteId]);

  const fetchAthleteDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/trainer/athletes/${athleteId}`);
      if (!response.ok) throw new Error('Failed to fetch athlete');
      const data = await response.json();
      setAthlete(data.athlete);
    } catch (err) {
      setError('Fehler beim Laden der Athletendaten');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigUpdate = () => {
    setShowEditModal(false);
    fetchAthleteDetail(); // Refresh data
  };

  const getAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error || !athlete) {
    return (
      <div className="space-y-4">
        <Alert variant="error">{error || 'Athlet nicht gefunden'}</Alert>
        <Button onClick={() => router.push('/trainer/athletes')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zur Liste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.push('/trainer/athletes')} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {athlete.firstName} {athlete.lastName}
            </h1>
            <p className="text-gray-600 mt-1">
              {getAge(athlete.birthDate)} Jahre • {athlete.youthCategory} Jugend
            </p>
          </div>
        </div>
        <Button onClick={() => setShowEditModal(true)} variant="primary">
          <Edit className="h-4 w-4 mr-2" />
          Konfiguration bearbeiten
        </Button>
      </div>

      {/* Alert for unexcused absences */}
      {athlete.attendanceStats.unexcusedAbsences >= 3 && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4 mr-2 inline" />
          <strong>Warnung:</strong> Dieser Athlet hat {athlete.attendanceStats.unexcusedAbsences}{' '}
          unentschuldigte Fehlzeiten.
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Persönliche Informationen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Vorname</p>
                  <p className="font-medium">{athlete.firstName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nachname</p>
                  <p className="font-medium">{athlete.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Geburtsdatum</p>
                  <p className="font-medium">
                    {format(new Date(athlete.birthDate), 'dd.MM.yyyy', { locale: de })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Geschlecht</p>
                  <p className="font-medium">{genderTranslations[athlete.gender]}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Kontaktdaten
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {athlete.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Telefon</p>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {athlete.phone}
                </p>
              </div>

              {/* Guardian Info */}
              {athlete.guardianName && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Erziehungsberechtigte(r)
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="text-gray-500">Name:</span>{' '}
                      <span className="font-medium">{athlete.guardianName}</span>
                    </p>
                    {athlete.guardianEmail && (
                      <p className="text-sm">
                        <span className="text-gray-500">Email:</span>{' '}
                        <span className="font-medium">{athlete.guardianEmail}</span>
                      </p>
                    )}
                    {athlete.guardianPhone && (
                      <p className="text-sm">
                        <span className="text-gray-500">Telefon:</span>{' '}
                        <span className="font-medium">{athlete.guardianPhone}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {athlete.emergencyContactName && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Notfallkontakt</p>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="text-gray-500">Name:</span>{' '}
                      <span className="font-medium">{athlete.emergencyContactName}</span>
                    </p>
                    {athlete.emergencyContactPhone && (
                      <p className="text-sm">
                        <span className="text-gray-500">Telefon:</span>{' '}
                        <span className="font-medium">{athlete.emergencyContactPhone}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Training & Stats */}
        <div className="space-y-6">
          {/* Training Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Trainingskonfiguration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Youth Category */}
              <div>
                <p className="text-sm text-gray-500">Jugendkategorie</p>
                <p className="font-semibold text-lg">{athlete.youthCategory} Jugend</p>
              </div>

              {/* Training Schedule */}
              <div>
                <p className="text-sm text-gray-500 mb-2">Trainingsgruppen</p>
                <div className="space-y-2">
                  {athlete.groupAssignments.length > 0 ? (
                    athlete.groupAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="bg-gray-50 rounded p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900">
                            {assignment.trainingName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {dayTranslations[assignment.trainingDay]}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-teal-600 font-medium">
                            {assignment.groupName}
                          </span>
                          <span className="text-xs text-gray-600">
                            {assignment.startTime.substring(0, 5)} - {assignment.endTime.substring(0, 5)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 italic">Keine Gruppen zugewiesen</p>
                  )}
                </div>
              </div>

              {/* Competition Status */}
              <div>
                <p className="text-sm text-gray-500">Wettkampfteilnahme</p>
                <p className="font-medium">
                  {athlete.competitionParticipation ? (
                    <span className="text-green-600">✓ Ja</span>
                  ) : (
                    <span className="text-gray-400">✗ Nein</span>
                  )}
                </p>
              </div>

              {/* Approval Date */}
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">
                  Genehmigt am{' '}
                  {format(new Date(athlete.approvedAt), 'dd.MM.yyyy', { locale: de })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Anwesenheitsstatistik
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">
                  {athlete.attendanceStats.attendancePercentage}%
                </p>
                <p className="text-sm text-gray-500 mt-1">Anwesenheit</p>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Gesamt</span>
                  <span className="font-semibold">{athlete.attendanceStats.totalSessions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Anwesend</span>
                  <span className="font-semibold text-green-600">
                    {athlete.attendanceStats.attended}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Entschuldigt</span>
                  <span className="font-semibold text-yellow-600">
                    {athlete.attendanceStats.excusedAbsences}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Unentschuldigt</span>
                  <span className="font-semibold text-red-600">
                    {athlete.attendanceStats.unexcusedAbsences}
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <Link href={`/trainer/athletes/${athlete.id}/attendance`}>
                  <Button variant="outline" size="sm" className="w-full">
                    Vollständige Historie anzeigen
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Configuration Modal */}
      {showEditModal && (
        <EditConfigModal
          athlete={athlete}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleConfigUpdate}
        />
      )}
    </div>
  );
}