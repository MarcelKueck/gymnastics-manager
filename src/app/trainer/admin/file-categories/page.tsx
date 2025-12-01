'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
import { Loading } from '@/components/ui/loading';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  FolderOpen,
  Plus,
  Edit,
  Trash2,
  GripVertical,
} from 'lucide-react';

interface UploadCategory {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { uploads: number };
}

export default function AdminFileCategoriesPage() {
  const [categories, setCategories] = useState<UploadCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editCategory, setEditCategory] = useState<UploadCategory | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<UploadCategory | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/files/categories');
      if (res.ok) {
        const result = await res.json();
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setName('');
    setDescription('');
    setSortOrder(categories.length);
    setEditCategory(null);
  };

  const handleOpenDialog = (category?: UploadCategory) => {
    if (category) {
      setEditCategory(category);
      setName(category.name);
      setDescription(category.description || '');
      setSortOrder(category.sortOrder);
    } else {
      resetForm();
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    resetForm();
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const url = editCategory
        ? `/api/files/categories/${editCategory.id}`
        : '/api/files/categories';
      const method = editCategory ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          sortOrder,
        }),
      });

      if (res.ok) {
        handleCloseDialog();
        await fetchCategories();
      } else {
        const result = await res.json();
        alert(result.error || 'Fehler beim Speichern');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCategory) return;

    try {
      const res = await fetch(`/api/files/categories/${deleteCategory.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchCategories();
      } else {
        const result = await res.json();
        alert(result.error || 'Fehler beim Löschen');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Fehler beim Löschen');
    } finally {
      setDeleteCategory(null);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dateikategorien</h1>
          <p className="text-muted-foreground">
            Kategorien für die Dateiablage verwalten
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Kategorie hinzufügen
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Keine Kategorien vorhanden</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Erstellen Sie Kategorien, um Dateien organisieren zu können.
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Erste Kategorie erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Kategorien</CardTitle>
            <CardDescription>{categories.length} Kategorie(n)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <FolderOpen className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{category.name}</p>
                      {category.description && (
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {category._count?.uploads || 0} Datei(en)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteCategory(category)}
                      disabled={(category._count?.uploads || 0) > 0}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Trainingsunterlagen"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="z.B. Wöchentliche Trainingspläne"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sortierung</Label>
              <Input
                id="sortOrder"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                Niedrigere Zahlen werden zuerst angezeigt
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
              {isSaving ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteCategory}
        onOpenChange={(open) => !open && setDeleteCategory(null)}
        title="Kategorie löschen"
        description={`Möchten Sie die Kategorie "${deleteCategory?.name}" wirklich löschen?`}
        confirmLabel="Löschen"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
