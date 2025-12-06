'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import {
  FileText,
  Download,
  FolderOpen,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface UploadCategory {
  id: string;
  name: string;
  description: string | null;
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

export default function AthleteFilesPage() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await fetch('/api/files');
        if (res.ok) {
          const result = await res.json();
          setFiles(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFiles();
  }, []);

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
      <h1 className="text-xl font-semibold sm:text-2xl">Dateien</h1>

      {files.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Trainingsdokumente</CardTitle>
            <CardDescription>
              Dokumente und Materialien für dein Training
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Keine Dateien verfügbar</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Aktuell sind keine Dokumente für dich freigegeben.
            </p>
          </CardContent>
        </Card>
      ) : (
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
                  <div
                    key={file.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <FileText className="h-8 w-8 text-red-600 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{file.title}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0 text-xs sm:text-sm text-muted-foreground">
                          <span className="truncate max-w-[150px] sm:max-w-none">{file.fileName}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{formatFileSize(file.fileSize)}</span>
                          {file.targetDate && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {file.targetDate}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground hidden sm:block">
                          Hochgeladen am{' '}
                          {format(new Date(file.uploadedAt), 'dd.MM.yyyy', { locale: de })}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => handleDownload(file)}>
                      <Download className="h-4 w-4" />
                    </Button>
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
