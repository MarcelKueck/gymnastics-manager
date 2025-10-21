'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { FileText, Download } from 'lucide-react';

interface UploadFile {
  id: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    sortOrder: number;
  };
  title: string;
  targetDate: string | null;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

export default function AthleteFilesPage() {
  const [uploads, setUploads] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/files');
      if (!response.ok) throw new Error('Failed to fetch files');
      const data = await response.json();
      setUploads(data.uploads || []);
    } catch (err) {
      setError('Fehler beim Laden der Dateien');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (uploadId: string, fileName: string) => {
    try {
      setDownloading(uploadId);
      const response = await fetch(`/api/files/${uploadId}/download`);
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

  // Group uploads by category
  const uploadsByCategory = uploads.reduce((acc, upload) => {
    const catId = upload.categoryId;
    if (!acc[catId]) {
      acc[catId] = {
        category: upload.category,
        uploads: [],
      };
    }
    acc[catId].uploads.push(upload);
    return acc;
  }, {} as Record<string, { category: UploadFile['category']; uploads: UploadFile[] }>);

  // Sort categories by sortOrder
  const sortedCategories = Object.values(uploadsByCategory).sort(
    (a, b) => a.category.sortOrder - b.category.sortOrder
  );

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
        <h1 className="text-2xl font-bold text-gray-900">Dateien</h1>
        <p className="text-gray-600 mt-1">Lade deine Dateien herunter</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Files by Category */}
      {sortedCategories.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Keine Dateien verfügbar
          </h3>
          <p className="text-gray-600">Dein Trainer hat noch keine Dateien hochgeladen.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedCategories.map(({ category, uploads: categoryUploads }) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle>{category.name}</CardTitle>
                <p className="text-sm text-gray-600">{categoryUploads.length} Dateien verfügbar</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryUploads.map((upload) => (
                    <div
                      key={upload.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <FileText className="h-5 w-5 text-teal-600 flex-shrink-0 mt-1" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900">{upload.title}</h4>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                            <span>{formatFileSize(upload.fileSize)}</span>
                            {upload.targetDate && (
                              <span className="text-teal-600 font-medium">
                                Ziel: {upload.targetDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleDownload(upload.id, upload.fileName)}
                        disabled={downloading === upload.id}
                      >
                        {downloading === upload.id ? (
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
          ))}
        </div>
      )}
    </div>
  );
}
