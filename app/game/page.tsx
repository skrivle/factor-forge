'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import GameArena from '@/components/game/GameArena';
import { DIFFICULTY_CONFIGS } from '@/lib/game/engine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function GamePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supportedTables, setSupportedTables] = useState<number[]>([1,2,3,4,5,6,7,8,9,10]);
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
  const [learningNeeded, setLearningNeeded] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchGroupSettings();
    }
  }, [session]);

  const fetchGroupSettings = async () => {
    try {
      const response = await fetch('/api/groups');
      if (response.ok) {
        const data = await response.json();
        if (data.group?.supported_tables) {
          setSupportedTables(data.group.supported_tables);
        }
      }
    } catch (error) {
      console.error('Error fetching group settings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    router.push('/auth/signin');
    return null;
  }

  const userRole = (session.user as any).role || 'child';
  // Admin and parent roles use parent config (hard difficulty)
  const baseConfig = (userRole === 'parent' || userRole === 'admin') ? DIFFICULTY_CONFIGS.parent : DIFFICULTY_CONFIGS.child;
  
  // Apply the group's supported tables to the config
  const config = {
    ...baseConfig,
    allowedTables: supportedTables,
  };

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
          difficultyLevel: (userRole === 'parent' || userRole === 'admin') ? 'hard' : 'easy',
          questions: stats?.questions,
          userAnswers: stats?.userAnswers,
          isCorrectAnswers: stats?.isCorrectAnswers,
          timeTaken: stats?.timeTaken,
        }),
      });

      if (!response.ok) {
        console.error('Failed to save game session');
      }
      const learningRes = await fetch('/api/learning/status');
      if (learningRes.ok) {
        const learning = await learningRes.json();
        setLearningNeeded(learning.learningNeeded === true);
      }
    } catch (error) {
      console.error('Error saving game:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePlayAgain = () => {
    setGameStats(null);
    setGameStarted(true);
  };

  const handleExit = () => {
    setGameStarted(false);
    setGameStats(null);
  };

  if (gameStarted) {
    return <GameArena config={config} onGameEnd={handleGameEnd} onExit={handleExit} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4 flex items-center justify-center">
        <div className="text-white text-2xl">Laden...</div>
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
                  Spel Afgelopen! 🎉
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-lg p-6 text-center">
                    <div className="text-sm text-gray-400 mb-2">Eindscor</div>
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

                {!saving && learningNeeded && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                    <p className="text-green-200 text-sm mb-3">
                      Wil je deze sommen nog even oefenen? Probeer Slimme Oefening 🎯
                    </p>
                    <Button
                      onClick={() => router.push('/practice')}
                      className="w-full bg-green-600 hover:bg-green-500 text-white font-bold text-lg h-12"
                    >
                      Slimme Oefening 🎯
                    </Button>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    onClick={handlePlayAgain}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg h-14"
                  >
                    Speel Opnieuw
                  </Button>
                  <Button
                    onClick={() => router.push('/leaderboard')}
                    variant="outline"
                    className="flex-1 border-purple-500/50 text-white hover:bg-purple-500/20 font-bold text-lg h-14"
                  >
                    Klassement
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
        ) : (
          <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-4">
                Klaar om te Spelen? ⚡
              </CardTitle>
              <div className="text-gray-300 text-lg">
                Hoi, {session.user.name}! 👋
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Spelregels</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>✅ {config.questionCount} rekenopgaven</li>
                  <li>🔢 Tafels: {supportedTables.join(', ')}</li>
                  <li>➗ Vermenigvuldiging en deling</li>
                  <li>⏱️ {config.timePerQuestion} seconden per vraag{config.decreaseTime && ' (afnemend!)'}</li>
                  <li>🎯 Typ je antwoord - je hoeft niet op Enter te drukken!</li>
                  <li>🔥 Maak combo's voor bonuspunten!</li>
                  <li>🏆 Versla je highscore!</li>
                </ul>
              </div>

              <div className="text-center text-sm text-gray-400">
                Moeilijkheidsgraad: <span className="text-purple-400 font-bold">{(userRole === 'parent' || userRole === 'admin') ? 'MOEILIJK' : 'GEMAKKELIJK'}</span>
              </div>

              <Button
                onClick={() => setGameStarted(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-2xl h-16 animate-pulse-glow"
              >
                Start Spel 🚀
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
