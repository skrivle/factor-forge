'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface Test {
  id: string;
  title: string;
  description: string | null;
  question_count: number;
  time_limit_seconds: number | null;
  tables_included: number[];
  include_division: boolean;
  created_at: string;
  creator_name: string;
}

export default function CreateTestPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [existingTests, setExistingTests] = useState<Test[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questionCount, setQuestionCount] = useState(20);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(null);
  const [hasTimeLimit, setHasTimeLimit] = useState(false);
  const [selectedTables, setSelectedTables] = useState<number[]>([2, 3, 4, 5]);
  const [includeDivision, setIncludeDivision] = useState(false);

  const availableTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  useEffect(() => {
    if (session?.user) {
      fetchUserProfile();
      fetchTests();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setGroupId(data.group_id);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/tests');
      if (response.ok) {
        const data = await response.json();
        setExistingTests(data.tests || []);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  const handleTableToggle = (table: number) => {
    setSelectedTables(prev => 
      prev.includes(table) 
        ? prev.filter(t => t !== table)
        : [...prev, table].sort((a, b) => a - b)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupId) {
      alert('Je moet eerst lid zijn van een groep!');
      return;
    }

    if (selectedTables.length === 0) {
      alert('Selecteer minstens één tafeltje!');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          title,
          description: description || null,
          questionCount,
          tablesIncluded: selectedTables,
          includeDivision,
          timeLimitSeconds: hasTimeLimit && timeLimitMinutes ? timeLimitMinutes * 60 : null,
        }),
      });

      if (response.ok) {
        alert('Test succesvol aangemaakt!');
        setTitle('');
        setDescription('');
        setQuestionCount(20);
        setHasTimeLimit(false);
        setTimeLimitMinutes(null);
        fetchTests();
      } else {
        const error = await response.json();
        alert(`Fout: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating test:', error);
      alert('Er ging iets mis bij het aanmaken van de test.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Weet je zeker dat je deze test wilt verwijderen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tests?testId=${testId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Test verwijderd!');
        fetchTests();
      } else {
        alert('Fout bij het verwijderen van de test.');
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('Er ging iets mis.');
    }
  };

  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== 'parent' && role !== 'admin')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4 flex items-center justify-center">
        <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg">
          <CardContent className="p-12 text-center text-white">
            <p>Alleen ouders en beheerders kunnen tests aanmaken.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!groupId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4 flex items-center justify-center">
        <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg">
          <CardContent className="p-12 text-center text-white">
            <p className="mb-4">Je moet eerst een groep aanmaken voordat je tests kunt maken.</p>
            <Button onClick={() => router.push('/groups/create')}>
              Maak een Groep
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="text-white mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug
        </Button>

        <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg mb-6">
          <CardHeader>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Nieuwe Test Maken
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white text-sm font-bold mb-2">
                  Titel *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                  placeholder="Bijv: Tafeltjes Test Week 1"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-bold mb-2">
                  Beschrijving (optioneel)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                  placeholder="Extra informatie over de test..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-white text-sm font-bold mb-2">
                  Aantal Vragen * ({questionCount})
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-bold mb-2">
                  Selecteer Tafeltjes *
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {availableTables.map(table => (
                    <button
                      key={table}
                      type="button"
                      onClick={() => handleTableToggle(table)}
                      className={`px-4 py-2 rounded font-bold transition-colors ${
                        selectedTables.includes(table)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {table}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center text-white space-x-2">
                  <input
                    type="checkbox"
                    checked={includeDivision}
                    onChange={(e) => setIncludeDivision(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Inclusief delingen</span>
                </label>
              </div>

              <div>
                <label className="flex items-center text-white space-x-2 mb-2">
                  <input
                    type="checkbox"
                    checked={hasTimeLimit}
                    onChange={(e) => setHasTimeLimit(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Tijdslimiet instellen</span>
                </label>
                {hasTimeLimit && (
                  <div className="mt-2">
                    <label className="block text-white text-sm mb-2">
                      Tijd (minuten)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={timeLimitMinutes || ''}
                      onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value) || null)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                      placeholder="Bijv: 10"
                    />
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !title || selectedTables.length === 0}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xl h-12"
              >
                <Plus className="mr-2 h-5 w-5" />
                {loading ? 'Bezig...' : 'Test Aanmaken'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {existingTests.length > 0 && (
          <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white">
                Bestaande Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {existingTests.map(test => (
                  <div
                    key={test.id}
                    className="bg-gray-900 border border-gray-700 rounded p-4 flex justify-between items-start"
                  >
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg">{test.title}</h3>
                      {test.description && (
                        <p className="text-gray-400 text-sm mt-1">{test.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-300">
                        <span>📝 {test.question_count} vragen</span>
                        <span>📊 Tafels: {test.tables_included.join(', ')}</span>
                        {test.include_division && <span>➗ Met delingen</span>}
                        {test.time_limit_seconds && (
                          <span>⏱️ {Math.floor(test.time_limit_seconds / 60)} min</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => router.push(`/tests/${test.id}/results`)}
                        variant="ghost"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Resultaten
                      </Button>
                      <Button
                        onClick={() => handleDeleteTest(test.id)}
                        variant="ghost"
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
