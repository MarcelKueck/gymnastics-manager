'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, Download, FileText, Search, Upload, Trash2, Edit } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function TrainerFilesContent() {
  const [files, setFiles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    categoryId: '',
    targetDate: '',
    file: null as File | null,
  });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchFiles();
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/files/categories');
      if (!response.ok) throw new Error('Fehler beim Laden der Kategorien');

      const data = await response.json();
      setCategories(data.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchFiles = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (searchQuery) params.append('query', searchQuery);

      const response = await fetch(`/api/files?${params.toString()}`);
      if (!response.ok) throw new Error('Fehler beim Laden der Dateien');

      const data = await response.json();
      setFiles(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/download`);
      if (!response.ok) throw new Error('Fehler beim Herunterladen');

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
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadFormData.file || !uploadFormData.categoryId || !uploadFormData.title) {
      alert('Bitte fülle alle Pflichtfelder aus');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadFormData.file);
      formData.append('title', uploadFormData.title);
      formData.append('categoryId', uploadFormData.categoryId);
      if (uploadFormData.targetDate) {
        formData.append('targetDate', uploadFormData.targetDate);
      }

      const response = await fetch('/api/trainer/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload fehlgeschlagen');
      }

      setIsUploadDialogOpen(false);
      setUploadFormData({ title: '', categoryId: '', targetDate: '', file: null });
      fetchFiles();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Möchtest du diese Datei wirklich löschen?')) return;

    try {
      const response = await fetch(`/api/trainer/files/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Fehler beim Löschen');

      fetchFiles();
    } catch (err) {
      alert('Fehler beim Löschen der Datei');
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

  const groupedFiles = files.reduce((acc, file) => {
    const categoryName = file.category?.name || 'Ohne Kategorie';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(file);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dateien</h1>
          <p className="text-muted-foreground">Trainingspläne und Dokumente verwalten</p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Datei hochladen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Datei hochladen</DialogTitle>
              <DialogDescription>
                Lade eine neue Datei für Athleten hoch
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={uploadFormData.title}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, title: e.target.value })}
                  placeholder="z.B. Trainingsplan Woche 42"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategorie *</Label>
                <select
                  id="category"
                  value={uploadFormData.categoryId}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, categoryId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Kategorie wählen</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetDate">Zieldatum (optional)</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={uploadFormData.targetDate}
                  onChange={(e) => setUploadFormData({ ...uploadFormData, targetDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Datei * (nur PDF)</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setUploadFormData({ ...uploadFormData, file: e.target.files?.[0] || null })}
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? 'Hochladen...' : 'Hochladen'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Dateien suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Alle Kategorien</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      {Object.keys(groupedFiles).length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            Keine Dateien gefunden
          </CardContent>
        </Card>
      ) : (
        (Object.entries(groupedFiles) as [string, any[]][]).map(([categoryName, categoryFiles]) => (
          <Card key={categoryName}>
            <CardHeader>
              <CardTitle>{categoryName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <h4 className="font-medium">{file.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {file.targetDate && `${file.targetDate} • `}
                          Hochgeladen am {formatDate(file.uploadedAt)} von {file.uploadedByTrainer?.firstName} {file.uploadedByTrainer?.lastName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file.id, file.fileName)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(file.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
