import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import {
  getUserSessions,
  getUserStats,
  calculateStreak,
  getGroupMembers,
  getUserGroupId,
  canViewChildStats,
} from '@/lib/db/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import NavigationButtons from '@/components/NavigationButtons';
import StatsCharts from '@/components/StatsCharts';
import ProgressOverview from '@/components/ProgressOverview';
import WeakAreasChart from '@/components/WeakAreasChart';
import PerformanceInsights from '@/components/PerformanceInsights';
import RecentGamesList from '@/components/RecentGamesList';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function StatsPage({ searchParams }: Props) {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const currentUserId = session.user.id;
  const role = (session.user as { role?: string }).role ?? 'child';
  const isParentOrAdmin = role === 'parent' || role === 'admin';

  const params = await searchParams;
  const childParam = typeof params?.child === 'string' ? params.child : undefined;

  // Resolve which user's stats we're showing
  let targetUserId = currentUserId;
  let titleLabel = 'Jouw Voortgang 📊';
  let children: { id: string; name: string }[] = [];

  if (isParentOrAdmin) {
    const groupId = await getUserGroupId(currentUserId);
    if (groupId) {
      const members = await getGroupMembers(groupId);
      children = members.filter((m) => m.role === 'child').map((m) => ({ id: m.id, name: m.name }));
    }
    if (childParam && children.some((c) => c.id === childParam)) {
      const allowed = await canViewChildStats(currentUserId, childParam);
      if (allowed) {
        targetUserId = childParam;
        const child = children.find((c) => c.id === childParam);
        titleLabel = child ? `Voortgang van ${child.name} 📊` : 'Voortgang 📊';
      }
    }
  }

  // Fetch data for the target user
  const [recentSessions, userStats, currentStreak] = await Promise.all([
    getUserSessions(targetUserId, 50),
    getUserStats(targetUserId),
    calculateStreak(targetUserId),
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
            {children.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                <Link
                  href="/stats"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    targetUserId === currentUserId
                      ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/50'
                      : 'bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20'
                  }`}
                >
                  Jouw voortgang
                </Link>
                {children.map((c) => (
                  <Link
                    key={c.id}
                    href={`/stats?child=${c.id}`}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      targetUserId === c.id
                        ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/50'
                        : 'bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
            <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              {titleLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <ProgressOverview stats={stats} totalSessions={recentSessions.length} />

            {recentSessions.length >= 5 && (
              <div className="mb-6">
                <PerformanceInsights sessions={recentSessions} />
              </div>
            )}

            {recentSessions.length > 0 ? (
              <div className="mb-6">
                <StatsCharts sessions={recentSessions} />
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8 sm:py-12">
                Nog geen spelgegevens. Speel je eerste spel om statistieken te zien! 🎮
              </div>
            )}

            {recentSessions.length > 0 && (
              <div className="mb-6">
                <RecentGamesList sessions={recentSessions} />
              </div>
            )}

            {recentSessions.length >= 5 && (
              <WeakAreasChart userId={targetUserId} />
            )}

            <NavigationButtons />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
