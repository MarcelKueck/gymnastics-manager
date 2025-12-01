'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Users, 
  UserCheck,
  GraduationCap,
  Shield,
  Mail,
  Phone,
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  isAthlete: boolean;
  isTrainer: boolean;
  athleteProfile: {
    id: string;
    status: string;
    youthCategory: string;
  } | null;
  trainerProfile: {
    id: string;
    role: string;
    isActive: boolean;
  } | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/users');
        if (!res.ok) throw new Error('Failed to fetch');
        const result = await res.json();
        setUsers(result.data);
      } catch {
        setError('Fehler beim Laden der Benutzer');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'athletes') {
      return matchesSearch && user.isAthlete;
    } else if (activeTab === 'trainers') {
      return matchesSearch && user.isTrainer;
    }
    return matchesSearch;
  });

  const athleteCount = users.filter((u) => u.isAthlete).length;
  const trainerCount = users.filter((u) => u.isTrainer).length;

  const getStatusBadge = (user: UserProfile) => {
    if (user.athleteProfile) {
      switch (user.athleteProfile.status) {
        case 'ACTIVE':
          return <Badge variant="default">Aktiv</Badge>;
        case 'PENDING':
          return <Badge variant="secondary">Ausstehend</Badge>;
        case 'INACTIVE':
          return <Badge variant="outline">Inaktiv</Badge>;
      }
    }
    return null;
  };

  const getRoleBadge = (user: UserProfile) => {
    if (user.trainerProfile) {
      if (user.trainerProfile.role === 'ADMIN') {
        return (
          <Badge variant="default" className="bg-purple-500">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      }
      return (
        <Badge variant="default" className="bg-blue-500">
          <GraduationCap className="h-3 w-3 mr-1" />
          Trainer
        </Badge>
      );
    }
    return null;
  };

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Benutzer verwalten</h1>
          <p className="text-muted-foreground">Athleten und Trainer verwalten</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Benutzer suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Alle
            <Badge variant="secondary">{users.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="athletes" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Athleten
            <Badge variant="secondary">{athleteCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="trainers" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Trainer
            <Badge variant="secondary">{trainerCount}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Keine Benutzer gefunden</h3>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {user.firstName} {user.lastName}
                          </span>
                          {getStatusBadge(user)}
                          {getRoleBadge(user)}
                          {user.athleteProfile && (
                            <Badge variant="outline">
                              {user.athleteProfile.youthCategory}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </span>
                          {user.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.isAthlete && user.isTrainer && (
                          <Badge variant="outline">Dual</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
