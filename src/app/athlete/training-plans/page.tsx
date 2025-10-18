'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { FileText, Download } from 'lucide-react';

interface TrainingPlan {
  id: string;
  category: string;
  title: string;
  targetDate: string | null;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

const categoryTranslations: Record<string, string> = {
  STRENGTH_GOALS: 'Kraftziele',
  STRENGTH_EXERCISES: 'Kraftübungen',
  STRETCHING_GOALS: 'Dehnziele',
  STRETCHING_EXERCISES: 'Dehnübungen',
};

const categories = [
  { value: 'STRENGTH_GOALS', label: 'Kraftziele' },
  { value: 'STRENGTH_EXERCISES', label: 'Kraftübungen' },
  { value: 'STRETCHING_GOALS', label: 'Dehnziele' },
  { value: 'STRETCHING_EXERCISES', label: 'Dehnübungen' },
];

export default function AthleteTrainingPlans() {
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
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
      if (!response.ok) throw new Error('Failed to fetch training plans');
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
      if (!response.ok) throw new Error('Download fehlgeschlagen');

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
      setError('Fehler beim Herunterladen');
      console.error(err);
    } finally {
      setDownloading(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Group plans by category
  const plansByCategory = plans.reduce((acc, plan) => {
    if (!acc[plan.category]) {
      acc[plan.category] = [];
    }
    acc[plan.category].push(plan);
    return acc;
  }, {} as Record<string, TrainingPlan[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trainingspläne</h1>
        <p className="text-gray-600 mt-1">Lade deine Trainingspläne herunter</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Plans by Category */}
      {Object.keys(plansByCategory).length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Keine Trainingspläne verfügbar
          </h3>
          <p className="text-gray-600">Dein Trainer hat noch keine Pläne hochgeladen.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryPlans = plansByCategory[category.value];
            if (!categoryPlans || categoryPlans.length === 0) return null;

            return (
              <Card key={category.value}>
                <CardHeader>
                  <CardTitle>{category.label}</CardTitle>
                  <p className="text-sm text-gray-600">{categoryPlans.length} Pläne verfügbar</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryPlans.map((plan) => (
                      <div
                        key={plan.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <FileText className="h-5 w-5 text-teal-600 flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900">{plan.title}</h4>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                              <span>{formatFileSize(plan.fileSize)}</span>
                              {plan.targetDate && (
                                <span className="text-teal-600 font-medium">
                                  Ziel: {plan.targetDate}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleDownload(plan.id, plan.fileName)}
                          disabled={downloading === plan.id}
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
      )}
    </div>
  );
}