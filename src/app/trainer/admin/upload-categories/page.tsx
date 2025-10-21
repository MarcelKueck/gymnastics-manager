'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { FolderPlus, Edit, Trash2, Save, X } from 'lucide-react';

interface UploadCategory {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  _count: {
    uploads: number;
  };
}

export default function UploadCategoriesPage() {
  const [categories, setCategories] = useState<UploadCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    sortOrder: 0,
  });

  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    sortOrder: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/upload-categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      setError('Fehler beim Laden der Kategorien');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newCategory.name.trim()) {
      setError('Bitte geben Sie einen Namen ein');
      return;
    }

    try {
      const response = await fetch('/api/admin/upload-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create category');
      }

      setSuccess('Kategorie erfolgreich erstellt!');
      setShowAddForm(false);
      setNewCategory({ name: '', description: '', sortOrder: 0 });
      fetchCategories();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen der Kategorie');
      console.error(err);
    }
  };

  const handleUpdate = async (categoryId: string) => {
    setError(null);
    setSuccess(null);

    if (!editForm.name.trim()) {
      setError('Bitte geben Sie einen Namen ein');
      return;
    }

    try {
      const response = await fetch(`/api/admin/upload-categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update category');
      }

      setSuccess('Kategorie erfolgreich aktualisiert!');
      setEditingId(null);
      fetchCategories();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Aktualisieren der Kategorie');
      console.error(err);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Möchten Sie diese Kategorie wirklich löschen?')) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/upload-categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete category');
      }

      setSuccess('Kategorie erfolgreich gelöscht!');
      fetchCategories();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Löschen der Kategorie');
      console.error(err);
    }
  };

  const startEdit = (category: UploadCategory) => {
    setEditingId(category.id);
    setEditForm({
      name: category.name,
      description: category.description || '',
      sortOrder: category.sortOrder,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', description: '', sortOrder: 0 });
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Upload-Kategorien</h1>
          <p className="text-gray-600 mt-1">Kategorien für Datei-Uploads verwalten</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} variant="primary">
          <FolderPlus className="h-4 w-4 mr-2" />
          {showAddForm ? 'Abbrechen' : 'Neue Kategorie'}
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {/* Add Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Neue Kategorie erstellen</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="z.B. Kraftziele"
                  required
                />
              </div>

              <div>
                <Label>Beschreibung (optional)</Label>
                <Textarea
                  value={newCategory.description}
                  onChange={(e) =>
                    setNewCategory((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="z.B. Kraft- und Fitnessziele"
                  rows={3}
                />
              </div>

              <div>
                <Label>Sortierung</Label>
                <Input
                  type="number"
                  value={newCategory.sortOrder}
                  onChange={(e) =>
                    setNewCategory((prev) => ({
                      ...prev,
                      sortOrder: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Niedrigere Zahlen werden zuerst angezeigt
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" variant="primary">
                  Erstellen
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  variant="outline"
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="text-center py-12">
          <FolderPlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Kategorien vorhanden</h3>
          <p className="text-gray-600">Erstellen Sie die erste Kategorie.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="p-6">
                {editingId === category.id ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Name *</Label>
                      <Input
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label>Beschreibung (optional)</Label>
                      <Textarea
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, description: e.target.value }))
                        }
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Sortierung</Label>
                      <Input
                        type="number"
                        value={editForm.sortOrder}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            sortOrder: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleUpdate(category.id)}
                        variant="primary"
                        size="sm"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Speichern
                      </Button>
                      <Button onClick={cancelEdit} variant="outline" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                        <span className="text-sm text-gray-500">
                          ({category._count.uploads} Dateien)
                        </span>
                      </div>
                      {category.description && (
                        <p className="text-gray-600 mt-1">{category.description}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">Sortierung: {category.sortOrder}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => startEdit(category)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(category.id)}
                        variant="danger"
                        size="sm"
                        disabled={category._count.uploads > 0}
                        title={
                          category._count.uploads > 0
                            ? 'Kategorie kann nicht gelöscht werden, da sie Dateien enthält'
                            : 'Kategorie löschen'
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
