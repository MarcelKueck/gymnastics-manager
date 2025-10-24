'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Search, Plus, X } from 'lucide-react';

interface Trainer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface GroupTrainersManagerProps {
  groupId: string;
  groupName: string;
  trainingName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function GroupTrainersManager({
  groupId,
  groupName,
  trainingName,
  open,
  onOpenChange,
  onUpdate,
}: GroupTrainersManagerProps) {
  const [currentTrainers, setCurrentTrainers] = useState<Trainer[]>([]);
  const [allTrainers, setAllTrainers] = useState<Trainer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, groupId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch group with current trainers
      const groupRes = await fetch(`/api/admin/groups/${groupId}`);
      if (!groupRes.ok) throw new Error('Failed to fetch group');
      const groupData = await groupRes.json();
      const group = groupData.data || groupData;
      
      // Extract trainers from trainerAssignments
      const trainers = group.trainerAssignments?.map((assignment: any) => assignment.trainer) || [];
      setCurrentTrainers(trainers);

      // Fetch all trainers
      const trainersRes = await fetch('/api/admin/trainers');
      if (!trainersRes.ok) throw new Error('Failed to fetch trainers');
      const trainersData = await trainersRes.json();
      setAllTrainers(trainersData.data || trainersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrainer = async (trainerId: string) => {
    setActionLoading(trainerId);
    try {
      const res = await fetch(`/api/admin/groups/${groupId}/trainers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainerIds: [trainerId] }),
      });

      if (!res.ok) throw new Error('Failed to add trainer');

      toast.success('Trainer erfolgreich hinzugefügt');
      await fetchData();
      onUpdate?.();
    } catch (error) {
      console.error('Error adding trainer:', error);
      toast.error('Fehler beim Hinzufügen des Trainers');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveTrainer = async (trainerId: string) => {
    setActionLoading(trainerId);
    try {
      const res = await fetch(`/api/admin/groups/${groupId}/trainers`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainerId }),
      });

      if (!res.ok) throw new Error('Failed to remove trainer');

      toast.success('Trainer erfolgreich entfernt');
      await fetchData();
      onUpdate?.();
    } catch (error) {
      console.error('Error removing trainer:', error);
      toast.error('Fehler beim Entfernen des Trainers');
    } finally {
      setActionLoading(null);
    }
  };

  const currentTrainerIds = new Set(currentTrainers.map(t => t.id));
  const availableTrainers = allTrainers.filter(
    trainer =>
      !currentTrainerIds.has(trainer.id) &&
      (searchTerm === '' ||
        `${trainer.firstName} ${trainer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Trainer verwalten: {trainingName} - {groupName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Trainers */}
            <div>
              <h3 className="text-sm font-medium mb-2">
                Aktuelle Trainer ({currentTrainers.length})
              </h3>
              <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                {currentTrainers.length === 0 ? (
                  <p className="text-sm text-gray-500 p-4 text-center">
                    Keine Trainer zugewiesen
                  </p>
                ) : (
                  currentTrainers.map((trainer) => (
                    <div
                      key={trainer.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {trainer.firstName} {trainer.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{trainer.email}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveTrainer(trainer.id)}
                        disabled={actionLoading === trainer.id}
                      >
                        {actionLoading === trainer.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Available Trainers */}
            <div>
              <h3 className="text-sm font-medium mb-2">Trainer hinzufügen</h3>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Trainer suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                {availableTrainers.length === 0 ? (
                  <p className="text-sm text-gray-500 p-4 text-center">
                    {searchTerm ? 'Keine Trainer gefunden' : 'Alle Trainer zugewiesen'}
                  </p>
                ) : (
                  availableTrainers.map((trainer) => (
                    <div
                      key={trainer.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {trainer.firstName} {trainer.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{trainer.email}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAddTrainer(trainer.id)}
                        disabled={actionLoading === trainer.id}
                      >
                        {actionLoading === trainer.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => onOpenChange(false)}>Schließen</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
