import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getUserSessions, getUserStats, calculateStreak } from '@/lib/db/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import NavigationButtons from '@/components/NavigationButtons';
import StatsCharts from '@/components/StatsCharts';
import ProgressOverview from '@/components/ProgressOverview';
import WeakAreasChart from '@/components/WeakAreasChart';
import PerformanceInsights from '@/components/PerformanceInsights';
import RecentGamesList from '@/components/RecentGamesList';

export default async function StatsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const userId = session.user.id;

  // Fetch user data
  const [recentSessions, userStats, currentStreak] = await Promise.all([
    getUserSessions(userId, 50), // Get more sessions for better charts
    getUserStats(userId),
    calculateStreak(userId),
  ]);

  const stats = {
    ...userStats,
    current_streak: currentStreak,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-2 sm:p-4">
      <div className="max-w-6xl mx-auto py-4 sm:py-8">
        <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              Jouw Voortgang 📊
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {/* Overview Stats */}
            <ProgressOverview stats={stats} totalSessions={recentSessions.length} />

            {/* Performance Insights */}
            {recentSessions.length >= 5 && (
              <div className="mb-6">
                <PerformanceInsights sessions={recentSessions} />
              </div>
            )}

            {/* Charts */}
            {recentSessions.length > 0 ? (
              <div className="mb-6">
                <StatsCharts sessions={recentSessions} />
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8 sm:py-12">
                Nog geen spelgegevens. Speel je eerste spel om statistieken te zien! 🎮
              </div>
            )}

            {/* Recent Games List */}
            {recentSessions.length > 0 && (
              <div className="mb-6">
                <RecentGamesList sessions={recentSessions} />
              </div>
            )}

            {/* Weak Areas */}
            {recentSessions.length >= 5 && (
              <WeakAreasChart userId={userId} />
            )}

            <NavigationButtons />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
