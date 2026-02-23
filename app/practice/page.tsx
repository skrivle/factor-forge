'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdaptiveExerciseArena from '@/components/exercise/AdaptiveExerciseArena';
import { DIFFICULTY_CONFIGS, type DueFactData } from '@/lib/game/engine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PracticePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [practiceStarted, setPracticeStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supportedTables, setSupportedTables] = useState<number[]>([1,2,3,4,5,6,7,8,9,10]);
  const [dueQuestions, setDueQuestions] = useState<DueFactData[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [practiceConfig, setPracticeConfig] = useState<any>(null);

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupResponse, practiceResponse] = await Promise.all([
        fetch('/api/groups'),
        fetch('/api/practice/weak-questions'),
      ]);

      if (groupResponse.ok) {
        const groupData = await groupResponse.json();
        if (groupData.group?.supported_tables) {
          setSupportedTables(groupData.group.supported_tables);
        }
      }

      if (practiceResponse.ok) {
        const data = await practiceResponse.json();
        setDueQuestions(data.dueQuestions ?? []);
        setDueCount(data.dueCount ?? 0);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const handleStartPractice = () => {
    // Apply the group's supported tables to the config
    const config = {
      ...baseConfig,
      allowedTables: supportedTables,
    };
    setPracticeConfig(config);
    setPracticeStarted(true);
  };

  const handleExit = () => {
    setPracticeStarted(false);
    setPracticeConfig(null);
    // Refresh data after practice
    fetchData();
  };

  if (practiceStarted && practiceConfig) {
    return <AdaptiveExerciseArena config={practiceConfig} dueQuestions={dueQuestions} onExit={handleExit} />;
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
        {dueCount === 0 ? (
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
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-xl font-bold text-white mb-2">Geen sommen vandaag</h3>
                <p className="text-gray-300 mb-4">
                  Er staan nog geen oefensommen klaar. Speel een spelletje om je oefenlijst op te bouwen!
                </p>
                <p className="text-gray-400 text-sm">
                  Daarna kun je hier gerichte oefensessies doen op het juiste moment.
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
                  <li>📅 Oefen op het juiste moment – sommen die vandaag aan bod moeten komen</li>
                  <li>🧠 Spaced repetition voor beter onthouden op lange termijn</li>
                  <li>⏱️ Geen tijdslimiet – neem de tijd die je nodig hebt!</li>
                  <li>🔄 Na een spelletje komen nieuwe sommen in je oefenlijst</li>
                  <li>📈 Telt niet mee voor streak, maar helpt je wel verbeteren!</li>
                </ul>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400">Sommen te oefenen vandaag</div>
                    <div className="text-2xl font-bold text-blue-400">{dueCount}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      In één sessie oefen je al je sommen voor vandaag
                      {dueCount > 50 && ' (max. 50 per sessie)'}.
                    </div>
                  </div>
                  <div className="text-4xl">📅</div>
                </div>
              </div>

              <div className="text-center text-sm text-gray-400">
                Moeilijkheidsgraad: <span className="text-purple-400 font-bold">{(userRole === 'parent' || userRole === 'admin') ? 'MOEILIJK' : 'GEMAKKELIJK'}</span>
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
