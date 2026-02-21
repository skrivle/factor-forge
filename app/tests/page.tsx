'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, CheckCircle, Clock } from 'lucide-react';

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

interface TestAttempt {
  id: string;
  test_id: string;
  score: number;
  total_questions: number;
  accuracy: number;
  time_taken_seconds: number | null;
  status: 'completed' | 'in_progress';
  completed_at: string | null;
}

export default function TestsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [attempts, setAttempts] = useState<Record<string, TestAttempt>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchTests();
    }
  }, [session]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tests');
      if (response.ok) {
        const data = await response.json();
        const testsList = data.tests || [];
        setTests(testsList);

        // Fetch attempts for each test
        const userId = (session?.user as any)?.id;
        const attemptsData: Record<string, TestAttempt> = {};
        
        for (const test of testsList) {
          const attemptResponse = await fetch(`/api/tests/attempts?testId=${test.id}&userId=${userId}`);
          if (attemptResponse.ok) {
            const attemptData = await attemptResponse.json();
            if (attemptData.attempt) {
              attemptsData[test.id] = attemptData.attempt;
            }
          }
        }
        
        setAttempts(attemptsData);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async (testId: string) => {
    // Check if already completed
    const attempt = attempts[testId];
    if (attempt && attempt.status === 'completed') {
      alert('Deze test is al voltooid en kan niet opnieuw worden gemaakt!');
      return;
    }

    router.push(`/tests/${testId}/take`);
  };

  if (!session?.user) {
    router.push('/auth/signin');
    return null;
  }

  const userRole = (session.user as any).role;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4 flex items-center justify-center">
        <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg">
          <CardContent className="p-12 text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <div>Bezig met laden...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <Button
            onClick={() => router.push('/')}
            variant="ghost"
            className="text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug
          </Button>
          
          {userRole === 'parent' && (
            <Button
              onClick={() => router.push('/tests/create')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
            >
              + Nieuwe Test
            </Button>
          )}
        </div>

        <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg mb-6">
          <CardHeader>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Tests 📝
            </CardTitle>
            <p className="text-gray-300 mt-2">
              {userRole === 'parent' 
                ? 'Maak tests voor je kinderen en bekijk hun resultaten.'
                : 'Maak de tests die voor jou zijn aangemaakt!'}
            </p>
          </CardHeader>
        </Card>

        {tests.length === 0 ? (
          <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg">
            <CardContent className="p-12 text-center">
              <p className="text-gray-300 text-lg mb-4">
                {userRole === 'parent' 
                  ? 'Je hebt nog geen tests aangemaakt.'
                  : 'Er zijn nog geen tests beschikbaar.'}
              </p>
              {userRole === 'parent' && (
                <Button
                  onClick={() => router.push('/tests/create')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                >
                  Maak je Eerste Test
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tests.map(test => {
              const attempt = attempts[test.id];
              const isCompleted = attempt && attempt.status === 'completed';

              return (
                <Card key={test.id} className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-white font-bold text-xl">{test.title}</h3>
                          {isCompleted && (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          )}
                        </div>
                        
                        {test.description && (
                          <p className="text-gray-400 mb-3">{test.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-3 text-sm text-gray-300 mb-4">
                          <span className="bg-blue-900/30 px-3 py-1 rounded">
                            📝 {test.question_count} vragen
                          </span>
                          <span className="bg-purple-900/30 px-3 py-1 rounded">
                            📊 Tafels: {test.tables_included.join(', ')}
                          </span>
                          {test.include_division && (
                            <span className="bg-pink-900/30 px-3 py-1 rounded">
                              ➗ Met delingen
                            </span>
                          )}
                          {test.time_limit_seconds && (
                            <span className="bg-orange-900/30 px-3 py-1 rounded">
                              <Clock className="inline h-4 w-4 mr-1" />
                              {Math.floor(test.time_limit_seconds / 60)} min
                            </span>
                          )}
                        </div>

                        {isCompleted && (
                          <div className="bg-green-900/20 border border-green-500/30 rounded p-3 mt-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-green-400 font-bold">Voltooid!</div>
                                <div className="text-gray-300 text-sm">
                                  Score: {attempt.score}/{attempt.total_questions} ({attempt.accuracy.toFixed(0)}%)
                                </div>
                              </div>
                              <Button
                                onClick={() => router.push(`/tests/${test.id}/results`)}
                                variant="ghost"
                                className="text-green-400 hover:text-green-300"
                              >
                                Bekijk Details
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex gap-2">
                        {!isCompleted && (
                          <Button
                            onClick={() => handleStartTest(test.id)}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Start Test
                          </Button>
                        )}
                        
                        {userRole === 'parent' && (
                          <Button
                            onClick={() => router.push(`/tests/${test.id}/results`)}
                            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
                          >
                            Resultaten
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
