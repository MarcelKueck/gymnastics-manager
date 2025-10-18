'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Download, FileText, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface TrainingPlan {
  id: string;
  title: string;
  category: string;
  targetDate: string | null;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  uploadedByTrainer: {
    firstName: string;
    lastName: string;
  };
}

interface GroupedPlans {
  STRENGTH_GOALS: TrainingPlan[];
  STRENGTH_EXERCISES: TrainingPlan[];
  STRETCHING_GOALS: TrainingPlan[];
  STRETCHING_EXERCISES: TrainingPlan[];
}

const categoryTranslations: Record<string, string> = {
  STRENGTH_GOALS: 'Kraftziele',
  STRENGTH_EXERCISES: 'Kraftübungen',
  STRETCHING_GOALS: 'Dehnziele',
  STRETCHING_EXERCISES: 'Dehnübungen',
};

const categoryDescriptions: Record<string, string> = {
  STRENGTH_GOALS: 'Ziele und Vorgaben für das Krafttraining',
  STRENGTH_EXERCISES: 'Übungen und Anleitungen für Kraft',
  STRETCHING_GOALS: 'Ziele und Vorgaben für Dehnung und Beweglichkeit',
  STRETCHING_EXERCISES: 'Übungen und Anleitungen für Dehnung',
};

const categoryIcons: Record<string, string> = {
  STRENGTH_GOALS: '🎯',
  STRENGTH_EXERCISES: '💪',
  STRETCHING_GOALS: '📊',
  STRETCHING_EXERCISES: '🧘',
};

export default function AthleteTrainingPlans() {
  const [plans, setPlans] = useState<GroupedPlans | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/training-plans');
      if (!response.ok) throw new Error('Failed to load training plans');
      const data = await response.json();
      setPlans(data.plans);
    } catch (err) {
      setError('Fehler beim Laden der Trainingspläne');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (planId: string, fileName: string) => {
    try {
      setDownloading(planId);
      
      const response = await fetch(`/api/training-plans/${planId}/download`);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Fehler beim Herunterladen der Datei');
      console.error(err);
    } finally {
      setDownloading(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Trainingspläne...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!plans) {
    return <Alert variant="info">Keine Trainingspläne verfügbar</Alert>;
  }

  const allCategories = Object.keys(plans) as Array<keyof GroupedPlans>;
  const hasAnyPlans = allCategories.some((category) => plans[category].length > 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trainingspläne</h1>
        <p className="text-sm text-gray-600 mt-1">
          Lade Trainingspläne herunter, die von deinen Trainern hochgeladen wurden
        </p>
      </div>

      {/* Info Alert */}
      <Alert variant="info">
        <FileText className="h-5 w-5" />
        <p className="text-sm">
          Alle Dokumente sind im PDF-Format. Du kannst sie herunterladen und jederzeit ansehen.
        </p>
      </Alert>

      {/* No plans available */}
      {!hasAnyPlans && (
        <Alert variant="warning">
          <p className="font-medium">Noch keine Trainingspläne verfügbar</p>
          <p className="text-sm mt-1">
            Deine Trainer haben noch keine Trainingspläne hochgeladen. Sobald neue Pläne verfügbar
            sind, erscheinen sie hier.
          </p>
        </Alert>
      )}

      {/* Training Plans by Category */}
      {allCategories.map((category) => {
        const categoryPlans = plans[category];
        
        if (categoryPlans.length === 0) return null;

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{categoryIcons[category]}</span>
                <div>
                  <div>{categoryTranslations[category]}</div>
                  <p className="text-sm font-normal text-gray-600 mt-1">
                    {categoryDescriptions[category]}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900">{plan.title}</h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-4 w-4" />
                          <span>{formatFileSize(plan.fileSize)}</span>
                        </div>
                        {plan.targetDate && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>{plan.targetDate}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <User className="h-4 w-4" />
                          <span>
                            {plan.uploadedByTrainer.firstName} {plan.uploadedByTrainer.lastName}
                          </span>
                        </div>
                        <span className="text-gray-400">
                          Hochgeladen:{' '}
                          {format(new Date(plan.uploadedAt), 'dd.MM.yyyy', { locale: de })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(plan.id, plan.fileName)}
                      disabled={downloading === plan.id}
                      className="ml-4 flex-shrink-0"
                    >
                      {downloading === plan.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600 mr-2"></div>
                          Lädt...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}