'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import GameArena from '@/components/game/GameArena';
import { DIFFICULTY_CONFIGS, generateAdaptiveQuestions, type WeakQuestionData } from '@/lib/game/engine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function PracticePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameStats, setGameStats] = useState<{
    score: number;
    accuracy: number;
    correctAnswers: number;
    incorrectAnswers: number;
    questions?: any[];
    userAnswers?: (number | null)[];
    isCorrectAnswers?: boolean[];
    timeTaken?: (number | null)[];
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weakQuestions, setWeakQuestions] = useState<WeakQuestionData[]>([]);
  const [hasEnoughData, setHasEnoughData] = useState(false);
  const [practiceConfig, setPracticeConfig] = useState<any>(null);

  useEffect(() => {
    if (session?.user) {
      fetchWeakQuestions();
    }
  }, [session]);

  const fetchWeakQuestions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/practice/weak-questions');
      if (response.ok) {
        const data = await response.json();
        setWeakQuestions(data.weakQuestions);
        setHasEnoughData(data.hasEnoughData);
      }
    } catch (error) {
      console.error('Error fetching weak questions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    router.push('/auth/signin');
    return null;
  }

  const userRole = (session.user as any).role || 'child';
  const baseConfig = userRole === 'parent' ? DIFFICULTY_CONFIGS.parent : DIFFICULTY_CONFIGS.child;

  const handleGameEnd = async (stats: typeof gameStats) => {
    setGameStats(stats);
    setGameStarted(false);
    setSaving(true);

    try {
      const response = await fetch('/api/game/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: stats?.score,
          accuracy: stats?.accuracy,
          difficultyLevel: 'practice', // Mark as practice session
          questions: stats?.questions,
          userAnswers: stats?.userAnswers,
          isCorrectAnswers: stats?.isCorrectAnswers,
          timeTaken: stats?.timeTaken,
        }),
      });

      if (!response.ok) {
        console.error('Failed to save practice session');
      }
      
      // Refresh weak questions after practice
      await fetchWeakQuestions();
    } catch (error) {
      console.error('Error saving practice:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleStartPractice = () => {
    // Generate adaptive questions based on weak areas
    const adaptiveQuestions = generateAdaptiveQuestions(baseConfig, weakQuestions);
    
    // Create a custom config with the adaptive questions
    setPracticeConfig({
      ...baseConfig,
      preGeneratedQuestions: adaptiveQuestions,
    });
    
    setGameStarted(true);
  };

  const handlePlayAgain = () => {
    setGameStats(null);
    handleStartPractice();
  };

  const handleExit = () => {
    setGameStarted(false);
    setGameStats(null);
    setPracticeConfig(null);
  };

  if (gameStarted && practiceConfig) {
    return <GameArena config={practiceConfig} onGameEnd={handleGameEnd} onExit={handleExit} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4 flex items-center justify-center">
        <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg">
          <CardContent className="p-12">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <div>Bezig met laden van je voortgang...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {gameStats ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                  Oefensessie Voltooid! 🎯
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-lg p-6 text-center">
                    <div className="text-sm text-gray-400 mb-2">Score</div>
                    <div className="text-4xl font-bold text-green-400">{gameStats.score}</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-lg p-6 text-center">
                    <div className="text-sm text-gray-400 mb-2">Nauwkeurigheid</div>
                    <div className="text-4xl font-bold text-blue-400">{gameStats.accuracy}%</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-lg p-6 text-center">
                    <div className="text-sm text-gray-400 mb-2">Correct</div>
                    <div className="text-4xl font-bold text-purple-400">{gameStats.correctAnswers}</div>
                  </div>
                  <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-lg p-6 text-center">
                    <div className="text-sm text-gray-400 mb-2">Fout</div>
                    <div className="text-4xl font-bold text-red-400">{gameStats.incorrectAnswers}</div>
                  </div>
                </div>

                {saving && (
                  <div className="text-center text-gray-400">Je voortgang wordt opgeslagen...</div>
                )}

                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 text-center">
                  <p className="text-gray-300 text-sm">
                    Blijf oefenen! Jouw zwakke punten worden bijgehouden om je sessies aan te passen.
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handlePlayAgain}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg h-14"
                  >
                    Oefen Opnieuw
                  </Button>
                  <Button
                    onClick={() => router.push('/game')}
                    variant="outline"
                    className="flex-1 border-purple-500/50 text-white hover:bg-purple-500/20 font-bold text-lg h-14"
                  >
                    Normaal Spel
                  </Button>
                </div>
                <Button
                  onClick={() => router.push('/')}
                  variant="ghost"
                  className="w-full text-gray-400 hover:text-white"
                >
                  Terug naar Home
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : !hasEnoughData ? (
          <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-4">
                Oefenmodus 🎯
              </CardTitle>
              <div className="text-gray-300 text-lg">
                Hoi, {session.user.name}! 👋
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-white mb-2">Niet Genoeg Data</h3>
                <p className="text-gray-300 mb-4">
                  Je hebt nog niet genoeg gespeeld om je zwakke punten te identificeren.
                </p>
                <p className="text-gray-400 text-sm">
                  Speel eerst een paar gewone spelletjes, dan kunnen we je helpen met gerichte oefensessies!
                </p>
              </div>

              <Button
                onClick={() => router.push('/game')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-2xl h-16"
              >
                Speel een Spelletje 🚀
              </Button>

              <Button
                onClick={() => router.push('/')}
                variant="ghost"
                className="w-full text-gray-400 hover:text-white"
              >
                Terug naar Home
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-4">
                Oefenmodus 🎯
              </CardTitle>
              <div className="text-gray-300 text-lg">
                Hoi, {session.user.name}! 👋
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Hoe werkt het?</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>🎯 Speciaal aangepaste vragen op basis van je zwakke punten</li>
                  <li>📊 Focus op sommen waar je moeite mee hebt</li>
                  <li>🧠 Slimme algoritme kiest de beste oefenvragen</li>
                  <li>💪 Help jezelf om beter te worden!</li>
                  <li>🔄 De oefenvragen passen zich aan terwijl je verbetert</li>
                </ul>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400">Zwakke Punten Gevonden</div>
                    <div className="text-2xl font-bold text-blue-400">{weakQuestions.length}</div>
                  </div>
                  <div className="text-4xl">📈</div>
                </div>
              </div>

              <div className="text-center text-sm text-gray-400">
                Moeilijkheidsgraad: <span className="text-purple-400 font-bold">{userRole === 'parent' ? 'MOEILIJK' : 'GEMAKKELIJK'}</span>
              </div>

              <Button
                onClick={handleStartPractice}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-2xl h-16 animate-pulse-glow"
              >
                Start Oefensessie 🎯
              </Button>

              <Button
                onClick={() => router.push('/')}
                variant="ghost"
                className="w-full text-gray-400 hover:text-white"
              >
                Terug naar Home
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
