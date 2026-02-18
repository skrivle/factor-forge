'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  id: string;
  name: string;
  role: string;
  current_streak?: number;
  best_score?: number;
  total_correct_answers?: number;
  weekly_score?: number;
  games_played?: number;
  avg_accuracy?: number;
}

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [leaderboardType, setLeaderboardType] = useState<'all-time' | 'weekly'>('all-time');
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    fetchLeaderboard();
  }, [leaderboardType, session, router]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/leaderboard?type=${leaderboardType}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg mb-6">
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Gezinsklassement 🏆
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-6">
              <Button
                onClick={() => setLeaderboardType('all-time')}
                className={`flex-1 ${
                  leaderboardType === 'all-time'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                Alle Tijden
              </Button>
              <Button
                onClick={() => setLeaderboardType('weekly')}
                className={`flex-1 ${
                  leaderboardType === 'weekly'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                Deze Week
              </Button>
            </div>

            {loading ? (
              <div className="text-center text-gray-400 py-12">Laden...</div>
            ) : data.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                Nog geen data. Wees de eerste om te spelen! 🎮
              </div>
            ) : (
              <div className="space-y-3">
                {data.map((entry, index) => {
                  const isCurrentUser = entry.name === session?.user?.name;
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-lg border-2 ${
                        isCurrentUser
                          ? 'bg-purple-500/20 border-purple-500'
                          : 'bg-gray-800/50 border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-2xl font-bold w-12 text-center">
                            {getMedalEmoji(index + 1)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-white">
                                {entry.name}
                              </span>
                              {isCurrentUser && (
                                <span className="text-xs bg-purple-600 px-2 py-1 rounded">JIJ</span>
                              )}
                              <span className="text-xs text-gray-400">
                                ({entry.role})
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-6 text-right">
                          {leaderboardType === 'all-time' ? (
                            <>
                              <div>
                                <div className="text-xs text-gray-400">Beste Score</div>
                                <div className="text-xl font-bold text-green-400">
                                  {entry.best_score || 0}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-400">Reeks</div>
                                <div className="text-xl font-bold text-orange-400 flex items-center gap-1">
                                  {entry.current_streak || 0}
                                  {(entry.current_streak || 0) >= 3 && <span>🔥</span>}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-400">Totaal Correct</div>
                                <div className="text-xl font-bold text-purple-400">
                                  {entry.total_correct_answers || 0}
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <div className="text-xs text-gray-400">Week Score</div>
                                <div className="text-xl font-bold text-green-400">
                                  {Math.round(Number(entry.weekly_score) || 0)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-400">Spellen</div>
                                <div className="text-xl font-bold text-blue-400">
                                  {entry.games_played || 0}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-400">Gem. Nauwkeurig</div>
                                <div className="text-xl font-bold text-purple-400">
                                  {Math.round(Number(entry.avg_accuracy) || 0)}%
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <Button
                onClick={() => router.push('/game')}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg h-14"
              >
                Speel Nu 🎮
              </Button>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="flex-1 border-purple-500/50 text-white hover:bg-purple-500/20 font-bold text-lg h-14"
              >
                Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
