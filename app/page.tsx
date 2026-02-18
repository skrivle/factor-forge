'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface UserStats {
  current_streak: number;
  best_score: number;
  total_correct_answers: number;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchUserStats();
    }
  }, [status, router]);

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-white text-2xl">Laden...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4">
      <div className="max-w-4xl mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg mb-6">
            <CardHeader className="text-center">
              <CardTitle className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-2">
                Factor Forge ⚡
              </CardTitle>
              <CardDescription className="text-xl text-gray-300">
                Welkom terug, {session.user?.name}! 👋
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {stats && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-lg p-4 text-center"
                  >
                    <div className="text-sm text-gray-400 mb-1">Huidige Reeks</div>
                    <div className="text-3xl font-bold text-orange-400 flex items-center justify-center gap-2">
                      {stats.current_streak || 0}
                      {(stats.current_streak || 0) >= 3 && <span className="animate-fire">🔥</span>}
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-lg p-4 text-center"
                  >
                    <div className="text-sm text-gray-400 mb-1">Beste Score</div>
                    <div className="text-3xl font-bold text-green-400">
                      {stats.best_score || 0}
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-lg p-4 text-center"
                  >
                    <div className="text-sm text-gray-400 mb-1">Totaal Correct</div>
                    <div className="text-3xl font-bold text-purple-400">
                      {stats.total_correct_answers || 0}
                    </div>
                  </motion.div>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/game')}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-2xl h-16 animate-pulse-glow"
                >
                  Start Spel 🚀
                </Button>
                <Button
                  onClick={() => router.push('/leaderboard')}
                  variant="outline"
                  className="w-full border-purple-500/50 text-white hover:bg-purple-500/20 font-bold text-lg h-14"
                >
                  Bekijk Klassement 🏆
                </Button>
                <Button
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  variant="ghost"
                  className="w-full text-gray-400 hover:text-white"
                >
                  Afmelden
                </Button>
              </div>

              <div className="text-center text-sm text-gray-400 pt-4 border-t border-gray-700">
                <p>Speel dagelijks om je reeks te behouden! 🎯</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="text-center text-xs text-gray-500 mt-8">
          <p>Factor Forge - Tafeloefening voor het Gezin</p>
          <p className="mt-1">Gemaakt met Next.js, TypeScript, en Tailwind CSS</p>
        </div>
      </div>
    </div>
  );
}
