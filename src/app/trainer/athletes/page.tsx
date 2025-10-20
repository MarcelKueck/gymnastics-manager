'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Users, Search, Eye, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  youthCategory: string;
  competitionParticipation: boolean;
  groupAssignments: Array<{
    groupNumber: number;
    trainingDay: string;
    hourNumber: number;
  }>;
  attendanceStats: {
    totalSessions: number;
    attended: number;
    attendancePercentage: number;
    unexcusedAbsences: number;
  };
}

const dayTranslations: Record<string, string> = {
  MONDAY: 'Mo',
  THURSDAY: 'Do',
  FRIDAY: 'Fr',
};

export default function AthletesList() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [youthCategoryFilter, setYouthCategoryFilter] = useState<string>('all');

  useEffect(() => {
    fetchAthletes();
  }, []);

  useEffect(() => {
    filterAthletes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athletes, searchTerm, groupFilter, youthCategoryFilter]);

  const fetchAthletes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/trainer/athletes');
      if (!response.ok) throw new Error('Failed to fetch athletes');
      const data = await response.json();
      setAthletes(data.athletes);
    } catch (err) {
      setError('Fehler beim Laden der Athleten');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterAthletes = () => {
    let filtered = [...athletes];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.firstName.toLowerCase().includes(search) ||
          a.lastName.toLowerCase().includes(search)
      );
    }

    // Group filter
    if (groupFilter !== 'all') {
      const groupNum = parseInt(groupFilter);
      filtered = filtered.filter((a) =>
        a.groupAssignments.some((g) => g.groupNumber === groupNum)
      );
    }

    // Youth category filter
    if (youthCategoryFilter !== 'all') {
      filtered = filtered.filter((a) => a.youthCategory === youthCategoryFilter);
    }

    setFilteredAthletes(filtered);
  };

  const getAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getGroupsDisplay = (assignments: Athlete['groupAssignments']) => {
    const groups = [...new Set(assignments.map((a) => a.groupNumber))];
    return groups.sort().join(', ');
  };

  const getScheduleDisplay = (assignments: Athlete['groupAssignments']) => {
    const schedule = assignments.map(
      (a) => `${dayTranslations[a.trainingDay]} ${a.hourNumber}.St G${a.groupNumber}`
    );
    return schedule.join(' | ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Athleten</h1>
        <p className="text-gray-600 mt-1">{athletes.length} aktive Athleten</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Suche nach Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Group Filter */}
            <div>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Alle Gruppen</option>
                <option value="1">Gruppe 1</option>
                <option value="2">Gruppe 2</option>
                <option value="3">Gruppe 3</option>
              </select>
            </div>

            {/* Youth Category Filter */}
            <div>
              <select
                value={youthCategoryFilter}
                onChange={(e) => setYouthCategoryFilter(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Alle Kategorien</option>
                <option value="F">F Jugend</option>
                <option value="E">E Jugend</option>
                <option value="D">D Jugend</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Athletes Grid */}
      {filteredAthletes.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Athleten gefunden</h3>
          <p className="text-gray-600">
            {searchTerm || groupFilter !== 'all' || youthCategoryFilter !== 'all'
              ? 'Versuchen Sie, die Filter anzupassen'
              : 'Es gibt noch keine genehmigten Athleten'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAthletes.map((athlete) => (
            <Card key={athlete.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {athlete.firstName} {athlete.lastName}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-gray-600">{getAge(athlete.birthDate)} Jahre</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-sm font-medium text-gray-700">
                        {athlete.youthCategory} Jugend
                      </span>
                    </div>
                  </div>
                  {athlete.attendanceStats.unexcusedAbsences >= 3 && (
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Groups */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Gruppen</p>
                  <p className="text-sm font-medium">
                    Gruppe {getGroupsDisplay(athlete.groupAssignments)}
                  </p>
                </div>

                {/* Schedule */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Trainingstermine</p>
                  <p className="text-sm text-gray-700">{getScheduleDisplay(athlete.groupAssignments)}</p>
                </div>

                {/* Attendance */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Anwesenheit</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-lg font-bold px-2 py-1 rounded ${getAttendanceColor(
                        athlete.attendanceStats.attendancePercentage
                      )}`}
                    >
                      {athlete.attendanceStats.attendancePercentage}%
                    </span>
                    <span className="text-xs text-gray-500">
                      ({athlete.attendanceStats.attended}/{athlete.attendanceStats.totalSessions})
                    </span>
                  </div>
                  {athlete.attendanceStats.unexcusedAbsences > 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      {athlete.attendanceStats.unexcusedAbsences} unentschuldigt
                    </p>
                  )}
                </div>

                {/* Competition Status */}
                {athlete.competitionParticipation && (
                  <div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Wettkampf
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t">
                  <Link href={`/trainer/athletes/${athlete.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      Details anzeigen
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}