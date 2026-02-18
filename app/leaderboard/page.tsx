'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import ActivityHeatmap from '@/components/ActivityHeatmap';
import MiniStreakChart from '@/components/MiniStreakChart';

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

interface ActivityDay {
  date: string;
  game_count: number;
}

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [leaderboardType, setLeaderboardType] = useState<'all-time' | 'weekly'>('all-time');
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [activities, setActivities] = useState<Record<string, ActivityDay[]>>({});
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

      // Fetch activities for all users in the leaderboard
      if (result.length > 0) {
        const userIds = result.map((entry: LeaderboardEntry) => entry.id).join(',');
        const activityResponse = await fetch(`/api/activity/users?userIds=${userIds}&days=14`);
        const activityData = await activityResponse.json();
        setActivities(activityData.activities || {});
      }
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-2 sm:p-4">
      <div className="max-w-4xl mx-auto py-4 sm:py-8">
        <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Gezinsklassement 🏆
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="flex gap-2 mb-4 sm:mb-6">
              <Button
                onClick={() => setLeaderboardType('all-time')}
                className={`flex-1 text-sm sm:text-base ${
                  leaderboardType === 'all-time'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                Alle Tijden
              </Button>
              <Button
                onClick={() => setLeaderboardType('weekly')}
                className={`flex-1 text-sm sm:text-base ${
                  leaderboardType === 'weekly'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                Deze Week
              </Button>
            </div>

            {loading ? (
              <div className="text-center text-gray-400 py-8 sm:py-12">Laden...</div>
            ) : data.length === 0 ? (
              <div className="text-center text-gray-400 py-8 sm:py-12">
                Nog geen data. Wees de eerste om te spelen! 🎮
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {data.map((entry, index) => {
                  const isCurrentUser = entry.name === session?.user?.name;
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-3 sm:p-4 rounded-lg border-2 ${
                        isCurrentUser
                          ? 'bg-purple-500/20 border-purple-500'
                          : 'bg-gray-800/50 border-gray-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        {/* Left side: Medal and Name */}
                        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                          <div className="text-xl sm:text-2xl font-bold w-8 sm:w-12 text-center flex-shrink-0">
                            {getMedalEmoji(index + 1)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              <span className="text-base sm:text-lg font-bold text-white truncate">
                                {entry.name}
                              </span>
                              {isCurrentUser && (
                                <span className="text-xs bg-purple-600 px-2 py-1 rounded flex-shrink-0">JIJ</span>
                              )}
                              <span className="text-xs text-gray-400 flex-shrink-0">
                                ({entry.role})
                              </span>
                            </div>
                            {/* Mini Streak Chart */}
                            <div className="mt-2">
                              <MiniStreakChart 
                                activity={activities[entry.id] || []} 
                                days={14}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Right side: Stats */}
                        <div className="flex gap-3 sm:gap-6 text-right justify-around sm:justify-end">
                          {leaderboardType === 'all-time' ? (
                            <>
                              <div className="flex-1 sm:flex-none">
                                <div className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">Beste Score</div>
                                <div className="text-base sm:text-xl font-bold text-green-400">
                                  {entry.best_score || 0}
                                </div>
                              </div>
                              <div className="flex-1 sm:flex-none">
                                <div className="text-[10px] sm:text-xs text-gray-400">Reeks</div>
                                <div className="text-base sm:text-xl font-bold text-orange-400 flex items-center justify-end gap-1 sm:gap-1.5">
                                  {entry.current_streak || 0}
                                  {(entry.current_streak || 0) >= 7 && <span className="text-sm sm:text-base">🔥🔥</span>}
                                  {(entry.current_streak || 0) >= 3 && (entry.current_streak || 0) < 7 && <span className="text-sm sm:text-base">🔥</span>}
                                  {(entry.current_streak || 0) > 0 && (entry.current_streak || 0) < 3 && (
                                    <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-400 inline-block"></span>
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 sm:flex-none">
                                <div className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">
                                  <span className="hidden sm:inline">Totaal </span>Correct
                                </div>
                                <div className="text-base sm:text-xl font-bold text-purple-400">
                                  {entry.total_correct_answers || 0}
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex-1 sm:flex-none">
                                <div className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">Week Score</div>
                                <div className="text-base sm:text-xl font-bold text-green-400">
                                  {Math.round(Number(entry.weekly_score) || 0)}
                                </div>
                              </div>
                              <div className="flex-1 sm:flex-none">
                                <div className="text-[10px] sm:text-xs text-gray-400">Spellen</div>
                                <div className="text-base sm:text-xl font-bold text-blue-400">
                                  {entry.games_played || 0}
                                </div>
                              </div>
                              <div className="flex-1 sm:flex-none">
                                <div className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">
                                  <span className="hidden sm:inline">Gem. </span>Nauwk.
                                </div>
                                <div className="text-base sm:text-xl font-bold text-purple-400">
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

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-6 sm:mt-8">
              <Button
                onClick={() => router.push('/game')}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-base sm:text-lg h-12 sm:h-14"
              >
                Speel Nu 🎮
              </Button>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="flex-1 border-purple-500/50 text-white hover:bg-purple-500/20 font-bold text-base sm:text-lg h-12 sm:h-14"
              >
                Home
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activity Heatmap for current user */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ActivityHeatmap weeks={20} />
        </motion.div>
      </div>
    </div>
  );
}
