'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import ExerciseArena from '@/components/exercise/ExerciseArena';

type OperationType = 'multiplication' | 'division' | 'both';

export default function ExercisePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [availableTables, setAvailableTables] = useState<number[]>([1,2,3,4,5,6,7,8,9,10]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<OperationType>('both');
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [stats, setStats] = useState<{
    correctAnswers: number;
    incorrectAnswers: number;
  }>({ correctAnswers: 0, incorrectAnswers: 0 });

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
          setAvailableTables(data.group.supported_tables);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4 flex items-center justify-center">
        <div className="text-white text-2xl">Laden...</div>
      </div>
    );
  }

  const handleExit = () => {
    setExerciseStarted(false);
    setSelectedTable(null);
    setStats({ correctAnswers: 0, incorrectAnswers: 0 });
  };

  const handleAnswerUpdate = (isCorrect: boolean) => {
    setStats((prev) => ({
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      incorrectAnswers: prev.incorrectAnswers + (isCorrect ? 0 : 1),
    }));
  };

  if (exerciseStarted && selectedTable) {
    return (
      <ExerciseArena
        selectedTable={selectedTable}
        operationType={selectedOperation}
        onExit={handleExit}
        onAnswerUpdate={handleAnswerUpdate}
        stats={stats}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-4">
              Oefen Modus 📚
            </CardTitle>
            <div className="text-gray-300 text-lg">
              Kies een tafel om te oefenen, {session.user.name}!
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Over Oefen Modus</h3>
              <ul className="space-y-2 text-gray-300">
                <li>✅ Kies een specifieke tafel om te oefenen</li>
                <li>➗ Kies vermenigvuldiging, deling of beide</li>
                <li>⏱️ Geen tijdslimiet - neem de tijd die je nodig hebt!</li>
                <li>🔄 Blijft doorgaan totdat je stopt</li>
                <li>📊 Zie je voortgang in real-time</li>
                <li>💡 Leer in je eigen tempo</li>
              </ul>
            </div>

            {/* Operation Type Selection */}
            <div className="space-y-3">
              <h3 className="text-white font-bold text-center">Kies Bewerkingstype</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => setSelectedOperation('multiplication')}
                  variant={selectedOperation === 'multiplication' ? 'default' : 'outline'}
                  className={`h-14 text-sm sm:text-lg font-bold transition-all ${
                    selectedOperation === 'multiplication'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-400'
                      : 'border-purple-500/50 text-white hover:bg-purple-500/20 hover:border-purple-400'
                  }`}
                >
                  <span className="hidden sm:inline">× Vermenigvuldiging</span>
                  <span className="sm:hidden">× Vermenigv.</span>
                </Button>
                <Button
                  onClick={() => setSelectedOperation('division')}
                  variant={selectedOperation === 'division' ? 'default' : 'outline'}
                  className={`h-14 text-sm sm:text-lg font-bold transition-all ${
                    selectedOperation === 'division'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-400'
                      : 'border-purple-500/50 text-white hover:bg-purple-500/20 hover:border-purple-400'
                  }`}
                >
                  ÷ Deling
                </Button>
                <Button
                  onClick={() => setSelectedOperation('both')}
                  variant={selectedOperation === 'both' ? 'default' : 'outline'}
                  className={`h-14 text-sm sm:text-lg font-bold transition-all ${
                    selectedOperation === 'both'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-400'
                      : 'border-purple-500/50 text-white hover:bg-purple-500/20 hover:border-purple-400'
                  }`}
                >
                  Beide
                </Button>
              </div>
            </div>

            {selectedTable && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-green-500/20 border-2 border-green-500/50 rounded-lg p-4 text-center"
              >
                <div className="text-white font-bold text-xl mb-2">
                  Tafel van {selectedTable} - {
                    selectedOperation === 'multiplication' ? 'Vermenigvuldiging' :
                    selectedOperation === 'division' ? 'Deling' :
                    'Beide'
                  }
                </div>
                <Button
                  onClick={() => setExerciseStarted(true)}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-xl h-14 animate-pulse-glow"
                >
                  Start Oefenen 🚀
                </Button>
              </motion.div>
            )}

            <div className="space-y-3">
              <h3 className="text-white font-bold text-center">Selecteer een Tafel</h3>
              <div className="grid grid-cols-5 gap-2">
                {availableTables.map((table) => (
                  <Button
                    key={table}
                    onClick={() => setSelectedTable(table)}
                    variant={selectedTable === table ? 'default' : 'outline'}
                    className={`h-16 text-2xl font-bold transition-all ${
                      selectedTable === table
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-400'
                        : 'border-purple-500/50 text-white hover:bg-purple-500/20 hover:border-purple-400'
                    }`}
                  >
                    {table}
                  </Button>
                ))}
              </div>
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
      </div>
    </div>
  );
}
