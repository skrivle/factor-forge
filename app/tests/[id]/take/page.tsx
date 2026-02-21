'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateQuestion, type Question } from '@/lib/game/engine';
import { ArrowLeft, Timer } from 'lucide-react';

interface Test {
  id: string;
  title: string;
  description: string | null;
  question_count: number;
  time_limit_seconds: number | null;
  tables_included: number[];
  include_division: boolean;
}

export default function TakeTestPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const testId = params?.id as string;

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [answer, setAnswer] = useState('');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [testStartTime, setTestStartTime] = useState<number>(Date.now());
  
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (session?.user && testId) {
      initializeTest();
    }
  }, [session, testId]);

  useEffect(() => {
    // Focus input when question changes
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex]);

  useEffect(() => {
    // Timer countdown
    if (timeRemaining !== null && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [timeRemaining, questions]);

  const initializeTest = async () => {
    setLoading(true);
    try {
      // Fetch test details
      const testResponse = await fetch(`/api/tests?testId=${testId}`);
      if (!testResponse.ok) {
        alert('Test niet gevonden');
        router.push('/tests');
        return;
      }
      
      const testData = await testResponse.json();
      setTest(testData);

      // Check if already completed
      const userId = (session?.user as any)?.id;
      const attemptResponse = await fetch(`/api/tests/attempts?testId=${testId}&userId=${userId}`);
      if (attemptResponse.ok) {
        const attemptData = await attemptResponse.json();
        if (attemptData.attempt && attemptData.attempt.status === 'completed') {
          alert('Deze test is al voltooid en kan niet opnieuw worden gemaakt!');
          router.push('/tests');
          return;
        }
      }

      // Generate questions
      const operations = testData.include_division 
        ? ['multiplication', 'division'] 
        : ['multiplication'];
      
      const generatedQuestions: Question[] = [];
      for (let i = 0; i < testData.question_count; i++) {
        generatedQuestions.push(
          generateQuestion(testData.tables_included, operations as any)
        );
      }
      
      setQuestions(generatedQuestions);
      setUserAnswers(new Array(testData.question_count).fill(null));

      // Start the attempt
      const startResponse = await fetch('/api/tests/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId, action: 'start' }),
      });

      if (startResponse.ok) {
        const startData = await startResponse.json();
        setAttemptId(startData.attempt.id);
        
        // Set timer if there's a time limit
        if (testData.time_limit_seconds) {
          setTimeRemaining(testData.time_limit_seconds);
        }
        
        setTestStartTime(Date.now());
      }

    } catch (error) {
      console.error('Error initializing test:', error);
      alert('Er ging iets mis bij het laden van de test.');
      router.push('/tests');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (!test || !attemptId) return;
    await submitTest();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const currentAnswer = answer.trim();
    if (!currentAnswer) return;

    const numAnswer = parseInt(currentAnswer);
    const newAnswers = [...userAnswers];
    newAnswers[currentIndex] = numAnswer;
    setUserAnswers(newAnswers);
    setAnswer('');

    // Move to next question or submit
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // All questions answered, submit the test
      await submitTest(newAnswers);
    }
  };

  const submitTest = async (finalAnswers?: (number | null)[]) => {
    if (!test || !attemptId) return;
    
    setSubmitting(true);
    
    const answersToSubmit = finalAnswers || userAnswers;
    const timeTaken = Math.floor((Date.now() - testStartTime) / 1000);
    
    // Calculate score
    let score = 0;
    const questionsWithAnswers = questions.map((q, i) => {
      const isCorrect = answersToSubmit[i] === q.answer;
      if (isCorrect) score++;
      
      return {
        question: q,
        userAnswer: answersToSubmit[i],
        isCorrect,
      };
    });

    const accuracy = (score / questions.length) * 100;

    try {
      const response = await fetch('/api/tests/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId,
          action: 'complete',
          attemptId,
          score,
          accuracy,
          timeTakenSeconds: timeTaken,
          questions: questionsWithAnswers,
        }),
      });

      if (response.ok) {
        router.push(`/tests/${testId}/complete?score=${score}&total=${questions.length}`);
      } else {
        alert('Er ging iets mis bij het opslaan van de test.');
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      alert('Er ging iets mis.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!session?.user) {
    router.push('/auth/signin');
    return null;
  }

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

  if (!test || questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4 flex items-center justify-center">
      <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg w-full max-w-2xl">
        <CardHeader>
          <div className="flex justify-between items-start mb-2">
            <CardTitle className="text-2xl font-bold text-white">
              {test.title}
            </CardTitle>
            {timeRemaining !== null && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded ${
                timeRemaining < 60 ? 'bg-red-900/30 text-red-400' : 'bg-blue-900/30 text-blue-400'
              }`}>
                <Timer className="h-5 w-5" />
                <span className="font-bold text-lg">{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="text-gray-300 text-sm mt-2">
            Vraag {currentIndex + 1} van {questions.length}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-6xl font-bold text-white mb-8">
              {currentQuestion.num1}{' '}
              {currentQuestion.operation === 'multiplication' ? '×' : '÷'}{' '}
              {currentQuestion.num2} = ?
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                ref={inputRef}
                type="number"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-full px-6 py-4 text-3xl text-center bg-gray-900 border-2 border-purple-500/50 rounded text-white focus:outline-none focus:border-purple-500"
                placeholder="?"
                autoFocus
                disabled={submitting}
              />

              <Button
                type="submit"
                disabled={!answer.trim() || submitting}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xl h-14"
              >
                {currentIndex < questions.length - 1 ? 'Volgende' : 'Indienen'}
              </Button>
            </form>
          </div>

          <div className="grid grid-cols-10 gap-1 mt-6">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded ${
                  i < currentIndex
                    ? 'bg-green-500'
                    : i === currentIndex
                    ? 'bg-purple-500'
                    : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
