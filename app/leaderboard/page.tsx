import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getLeaderboard, getWeeklyLeaderboard, getUserActivities } from '@/lib/db/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ActivityHeatmap from '@/components/ActivityHeatmap';
import TabSwitcher from '@/components/TabSwitcher';
import LeaderboardEntryWrapper from '@/components/LeaderboardEntryWrapper';
import NavigationButtons from '@/components/NavigationButtons';
import MiniStreakChart from '@/components/MiniStreakChart';

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

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

function getMedalEmoji(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

export default async function LeaderboardPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const params = await searchParams;
  const leaderboardType = (params.type === 'weekly' ? 'weekly' : 'all-time') as 'all-time' | 'weekly';

  // Fetch leaderboard data
  const data = (leaderboardType === 'weekly'
    ? await getWeeklyLeaderboard()
    : await getLeaderboard(10)) as LeaderboardEntry[];

  // Fetch activities for all users in the leaderboard
  const userIds = data.map((entry) => entry.id);
  const activities = await getUserActivities(userIds, 14);

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
            <TabSwitcher currentType={leaderboardType} />

            {data.length === 0 ? (
              <div className="text-center text-gray-400 py-8 sm:py-12">
                Nog geen data. Wees de eerste om te spelen! 🎮
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {data.map((entry, index) => {
                  const isCurrentUser = entry.name === session.user.name;
                  return (
                    <LeaderboardEntryWrapper
                      key={entry.id}
                      index={index}
                      isCurrentUser={isCurrentUser}
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
                    </LeaderboardEntryWrapper>
                  );
                })}
              </div>
            )}

            <NavigationButtons />
          </CardContent>
        </Card>

        {/* Activity Heatmap for current user */}
        <ActivityHeatmap weeks={20} />
      </div>
    </div>
  );
}
