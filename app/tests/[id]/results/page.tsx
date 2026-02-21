'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Test {
  id: string;
  title: string;
  description: string | null;
  question_count: number;
  time_limit_seconds: number | null;
  tables_included: number[];
  include_division: boolean;
  created_at: string;
}

interface TestAttempt {
  id: string;
  test_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  score: number;
  total_questions: number;
  accuracy: string | number; // decimal type from DB returns as string
  time_taken_seconds: number | null;
  status: 'completed' | 'in_progress';
  started_at: string;
  completed_at: string | null;
  questions?: any;
}

export default function TestResultsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const testId = params?.id as string;

  const [test, setTest] = useState<Test | null>(null);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState<TestAttempt | null>(null);

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }
    
    if (testId) {
      fetchTestAndAttempts();
    }
  }, [session, testId, router]);

  const fetchTestAndAttempts = async () => {
    setLoading(true);
    try {
      // Fetch test details
      const testResponse = await fetch(`/api/tests?testId=${testId}`);
      if (testResponse.ok) {
        const testData = await testResponse.json();
        setTest(testData);
      }

      // Fetch attempts
      const attemptsResponse = await fetch(`/api/tests/attempts?testId=${testId}`);
      if (attemptsResponse.ok) {
        const attemptsData = await attemptsResponse.json();
        setAttempts(attemptsData.attempts || []);
      }
    } catch (error) {
      console.error('Error fetching test results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
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

  if (!test) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4 flex items-center justify-center">
        <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg">
          <CardContent className="p-12 text-center text-white">
            Test niet gevonden.
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const completedAttempts = attempts.filter(a => a.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4">
      <div className="max-w-6xl mx-auto py-8">
        <Button
          onClick={() => router.push('/tests')}
          variant="ghost"
          className="text-white mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug naar Tests
        </Button>

        <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg mb-6">
          <CardHeader>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              {test.title}
            </CardTitle>
            {test.description && (
              <p className="text-gray-300 mt-2">{test.description}</p>
            )}
            <div className="flex flex-wrap gap-3 text-sm text-gray-300 mt-4">
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
                  ⏱️ {Math.floor(test.time_limit_seconds / 60)} min
                </span>
              )}
            </div>
          </CardHeader>
        </Card>

        {completedAttempts.length === 0 ? (
          <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg">
            <CardContent className="p-12 text-center text-gray-300">
              Nog geen voltooide pogingen voor deze test.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {completedAttempts.map(attempt => (
              <Card key={attempt.id} className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-purple-400" />
                        <span className="text-white font-bold text-lg">{attempt.user_name}</span>
                        <span className="text-gray-400 text-sm">({attempt.user_role})</span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-green-900/20 border border-green-500/30 rounded p-3">
                          <div className="text-green-400 text-sm">Score</div>
                          <div className="text-white font-bold text-xl">
                            {attempt.score}/{attempt.total_questions}
                          </div>
                        </div>

                        <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3">
                          <div className="text-blue-400 text-sm">Nauwkeurigheid</div>
                          <div className="text-white font-bold text-xl">
                            {Number(attempt.accuracy).toFixed(0)}%
                          </div>
                        </div>

                        <div className="bg-purple-900/20 border border-purple-500/30 rounded p-3">
                          <div className="text-purple-400 text-sm flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Tijd
                          </div>
                          <div className="text-white font-bold text-lg">
                            {formatDuration(attempt.time_taken_seconds)}
                          </div>
                        </div>

                        <div className="bg-orange-900/20 border border-orange-500/30 rounded p-3">
                          <div className="text-orange-400 text-sm flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Datum
                          </div>
                          <div className="text-white font-bold text-sm">
                            {formatDate(attempt.completed_at)}
                          </div>
                        </div>
                      </div>

                      {selectedAttempt?.id === attempt.id && attempt.questions && (
                        <div className="mt-4 bg-gray-900/50 rounded p-4 max-h-96 overflow-y-auto">
                          <h4 className="text-white font-bold mb-3">Gedetailleerde Antwoorden:</h4>
                          <div className="space-y-2">
                            {attempt.questions.map((q: any, i: number) => (
                              <div 
                                key={i} 
                                className={`flex items-center justify-between p-2 rounded ${
                                  q.isCorrect ? 'bg-green-900/20' : 'bg-red-900/20'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {q.isCorrect ? (
                                    <CheckCircle className="h-4 w-4 text-green-400" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-400" />
                                  )}
                                  <span className="text-white">
                                    {q.question.num1} {q.question.operation === 'multiplication' ? '×' : '÷'} {q.question.num2}
                                  </span>
                                </div>
                                <div className="text-white">
                                  {q.userAnswer !== null ? q.userAnswer : '?'} 
                                  {!q.isCorrect && (
                                    <span className="text-gray-400 ml-2">
                                      (correct: {q.question.answer})
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => setSelectedAttempt(
                        selectedAttempt?.id === attempt.id ? null : attempt
                      )}
                      variant="ghost"
                      className="text-purple-400 hover:text-purple-300"
                    >
                      {selectedAttempt?.id === attempt.id ? 'Verberg Details' : 'Toon Details'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
