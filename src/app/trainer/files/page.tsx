'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Upload, FileText, Trash2, Download } from 'lucide-react';

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
  uploadedByTrainer: {
    firstName: string;
    lastName: string;
  };
}

interface UploadCategory {
  id: string;
  name: string;
  sortOrder: number;
}

export default function FilesPage() {
  const [uploads, setUploads] = useState<UploadFile[]>([]);
  const [categories, setCategories] = useState<UploadCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Upload form state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    categoryId: '',
    title: '',
    targetDate: '',
    file: null as File | null,
  });

  useEffect(() => {
    fetchCategories();
    fetchUploads();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/upload-categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      const cats = data.categories || [];
      setCategories(cats);
      
      // Set default category
      if (cats.length > 0 && !uploadForm.categoryId) {
        setUploadForm((prev) => ({ ...prev, categoryId: cats[0].id }));
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchUploads = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trainer/files');
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        setError('Nur PDF-Dateien sind erlaubt');
        return;
      }
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('Datei ist zu groß (max. 10MB)');
        return;
      }
      setUploadForm((prev) => ({ ...prev, file }));
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!uploadForm.file) {
      setError('Bitte wählen Sie eine Datei aus');
      return;
    }

    if (!uploadForm.title.trim()) {
      setError('Bitte geben Sie einen Titel ein');
      return;
    }

    if (!uploadForm.categoryId) {
      setError('Bitte wählen Sie eine Kategorie aus');
      return;
    }

    try {
      setUploading(true);

      // Create FormData
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('categoryId', uploadForm.categoryId);
      formData.append('title', uploadForm.title);
      if (uploadForm.targetDate) {
        formData.append('targetDate', uploadForm.targetDate);
      }

      const response = await fetch('/api/trainer/files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload fehlgeschlagen');
      }

      setSuccess('Datei erfolgreich hochgeladen!');
      setShowUploadForm(false);
      setUploadForm({
        categoryId: categories[0]?.id || '',
        title: '',
        targetDate: '',
        file: null,
      });
      fetchUploads();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Hochladen';
      setError(errorMessage);
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (uploadId: string) => {
    if (!confirm('Möchten Sie diese Datei wirklich löschen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/trainer/files/${uploadId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Löschen fehlgeschlagen');
      }

      setSuccess('Datei gelöscht');
      fetchUploads();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Löschen';
      setError(errorMessage);
      console.error(err);
    }
  };

  const handleDownload = async (uploadId: string, fileName: string) => {
    try {
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
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Group uploads by category
  const uploadsByCategory = (uploads || []).reduce((acc, upload) => {
    const catId = upload.categoryId;
    if (!acc[catId]) {
      acc[catId] = [];
    }
    acc[catId].push(upload);
    return acc;
  }, {} as Record<string, UploadFile[]>);

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
          <h1 className="text-2xl font-bold text-gray-900">Dateien</h1>
          <p className="text-gray-600 mt-1">Dateien verwalten und hochladen</p>
        </div>
        <Button onClick={() => setShowUploadForm(!showUploadForm)} variant="primary">
          <Upload className="h-4 w-4 mr-2" />
          {showUploadForm ? 'Abbrechen' : 'Datei hochladen'}
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {/* Upload Form */}
      {showUploadForm && (
        <Card>
          <CardHeader>
            <CardTitle>Neue Datei hochladen</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <Label>Kategorie *</Label>
                <select
                  value={uploadForm.categoryId}
                  onChange={(e) =>
                    setUploadForm((prev) => ({ ...prev, categoryId: e.target.value }))
                  }
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Titel *</Label>
                <Input
                  value={uploadForm.title}
                  onChange={(e) =>
                    setUploadForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="z.B. Krafttraining Basis"
                  required
                />
              </div>

              <div>
                <Label>Zieldatum (optional)</Label>
                <Input
                  type="text"
                  value={uploadForm.targetDate}
                  onChange={(e) =>
                    setUploadForm((prev) => ({ ...prev, targetDate: e.target.value }))
                  }
                  placeholder="z.B. April 2026"
                />
              </div>

              <div>
                <Label>PDF-Datei * (max. 10MB)</Label>
                <Input type="file" accept=".pdf" onChange={handleFileChange} required />
                {uploadForm.file && (
                  <p className="text-sm text-gray-600 mt-2">
                    Ausgewählt: {uploadForm.file.name} ({formatFileSize(uploadForm.file.size)})
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={uploading} variant="primary">
                  {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  variant="outline"
                  disabled={uploading}
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Files by Category */}
      {Object.keys(uploadsByCategory).length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Keine Dateien vorhanden
          </h3>
          <p className="text-gray-600">Laden Sie die erste Datei hoch.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryUploads = uploadsByCategory[category.id];
            if (!categoryUploads || categoryUploads.length === 0) return null;

            return (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle>{category.name}</CardTitle>
                  <p className="text-sm text-gray-600">{categoryUploads.length} Dateien</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryUploads.map((upload) => (
                      <div
                        key={upload.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <FileText className="h-5 w-5 text-orange-600 flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900">{upload.title}</h4>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                              <span>{upload.fileName}</span>
                              <span>{formatFileSize(upload.fileSize)}</span>
                              {upload.targetDate && <span>Ziel: {upload.targetDate}</span>}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Hochgeladen: {formatDate(upload.uploadedAt)} von{' '}
                              {upload.uploadedByTrainer.firstName} {upload.uploadedByTrainer.lastName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(upload.id, upload.fileName)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(upload.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
