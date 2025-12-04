'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loading } from '@/components/ui/loading';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  FileText,
  Upload,
  FolderOpen,
  Download,
  Trash2,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface UploadCategory {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  _count?: { uploads: number };
}

interface UploadFile {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  targetDate: string | null;
  uploadedAt: string;
  category: UploadCategory;
  uploadedByTrainer: {
    user: { firstName: string; lastName: string };
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TrainerFilesPage() {
  const [categories, setCategories] = useState<UploadCategory[]>([]);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [deleteFile, setDeleteFile] = useState<UploadFile | null>(null);
  
  // Upload form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadTargetDate, setUploadTargetDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/files/categories');
      if (res.ok) {
        const result = await res.json();
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchFiles = async (categoryId?: string | null) => {
    try {
      const url = categoryId 
        ? `/api/files?categoryId=${categoryId}` 
        : '/api/files';
      const res = await fetch(url);
      if (res.ok) {
        const result = await res.json();
        setFiles(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchCategories(), fetchFiles()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    fetchFiles(selectedCategory);
  }, [selectedCategory]);

  const handleUpload = async () => {
    if (!selectedFile || !uploadTitle.trim() || !uploadCategory) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', uploadTitle.trim());
      formData.append('categoryId', uploadCategory);
      if (uploadTargetDate) {
        formData.append('targetDate', uploadTargetDate);
      }

      const res = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setShowUploadDialog(false);
        resetUploadForm();
        await Promise.all([fetchCategories(), fetchFiles(selectedCategory)]);
      } else {
        const result = await res.json();
        alert(result.error || 'Fehler beim Hochladen');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Fehler beim Hochladen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteFile) return;

    try {
      const res = await fetch(`/api/files/${deleteFile.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await Promise.all([fetchCategories(), fetchFiles(selectedCategory)]);
      } else {
        const result = await res.json();
        alert(result.error || 'Fehler beim Löschen');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Fehler beim Löschen');
    } finally {
      setDeleteFile(null);
    }
  };

  const handleDownload = async (file: UploadFile) => {
    try {
      const res = await fetch(`/api/files/${file.id}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Fehler beim Herunterladen');
    }
  };

  const resetUploadForm = () => {
    setUploadTitle('');
    setUploadCategory('');
    setUploadTargetDate('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const groupedFiles = files.reduce((acc, file) => {
    const categoryName = file.category.name;
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(file);
    return acc;
  }, {} as Record<string, UploadFile[]>);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dateien"
        description="Dokumente und Dateien verwalten"
        actions={
          <Button className="h-10" onClick={() => setShowUploadDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Datei hochladen
          </Button>
        }
      />

      {/* Category Filter */}
      <div className="flex items-center gap-4">
        <Label>Kategorie:</Label>
        <Select
          value={selectedCategory || 'all'}
          onValueChange={(value) => setSelectedCategory(value === 'all' ? null : value)}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Alle Kategorien" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name} ({cat._count?.uploads || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Files List */}
      {files.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Keine Dateien vorhanden</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              {categories.length === 0
                ? 'Erstellen Sie zuerst Kategorien in der Administration, um Dateien hochladen zu können.'
                : 'Laden Sie die erste Datei hoch, um die Dateiablage zu nutzen.'}
            </p>
            {categories.length > 0 && (
              <Button onClick={() => setShowUploadDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Datei hochladen
              </Button>
            )}
          </CardContent>
        </Card>
      ) : selectedCategory ? (
        // Single category view
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              {categories.find((c) => c.id === selectedCategory)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  onDownload={() => handleDownload(file)}
                  onDelete={() => setDeleteFile(file)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        // Grouped by category view
        Object.entries(groupedFiles).map(([categoryName, categoryFiles]) => (
          <Card key={categoryName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                {categoryName}
              </CardTitle>
              <CardDescription>{categoryFiles.length} Datei(en)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categoryFiles.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    onDownload={() => handleDownload(file)}
                    onDelete={() => setDeleteFile(file)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={(open) => {
        setShowUploadDialog(open);
        if (!open) resetUploadForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Datei hochladen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">Datei (nur PDF)</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,application/pdf"
                ref={fileInputRef}
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="z.B. Trainingsplan Woche 23"
              />
            </div>
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetDate">Zieldatum (optional)</Label>
              <Input
                id="targetDate"
                value={uploadTargetDate}
                onChange={(e) => setUploadTargetDate(e.target.value)}
                placeholder="z.B. KW 23 oder 15.12.2025"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || !selectedFile || !uploadTitle.trim() || !uploadCategory}
            >
              {isUploading ? 'Wird hochgeladen...' : 'Hochladen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteFile}
        onOpenChange={(open) => !open && setDeleteFile(null)}
        title="Datei löschen"
        description={`Möchten Sie die Datei "${deleteFile?.title}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmLabel="Löschen"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}

function FileRow({
  file,
  onDownload,
  onDelete,
}: {
  file: UploadFile;
  onDownload: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-red-600" />
        <div>
          <p className="font-medium">{file.title}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{file.fileName}</span>
            <span>•</span>
            <span>{formatFileSize(file.fileSize)}</span>
            {file.targetDate && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {file.targetDate}
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Hochgeladen von {file.uploadedByTrainer.user.firstName}{' '}
            {file.uploadedByTrainer.user.lastName} am{' '}
            {format(new Date(file.uploadedAt), 'dd.MM.yyyy', { locale: de })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onDownload}>
          <Download className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
