'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface GameSession {
  id: string;
  score: number;
  accuracy: number;
  difficulty_level: 'easy' | 'medium' | 'hard';
  completed_at: Date | string;
}

interface PerformanceInsightsProps {
  sessions: GameSession[];
}

export default function PerformanceInsights({ sessions }: PerformanceInsightsProps) {
  const insights = useMemo(() => {
    if (sessions.length === 0) return null;

    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
    );

    const recentSessions = sortedSessions.slice(-5);
    const olderSessions = sortedSessions.slice(0, -5);

    const recentAvgScore =
      recentSessions.reduce((sum, s) => sum + s.score, 0) / recentSessions.length;
    const olderAvgScore =
      olderSessions.length > 0
        ? olderSessions.reduce((sum, s) => sum + s.score, 0) / olderSessions.length
        : recentAvgScore;

    const recentAvgAccuracy =
      recentSessions.reduce((sum, s) => sum + Number(s.accuracy), 0) / recentSessions.length;
    const olderAvgAccuracy =
      olderSessions.length > 0
        ? olderSessions.reduce((sum, s) => sum + Number(s.accuracy), 0) / olderSessions.length
        : recentAvgAccuracy;

    const scoreTrend = recentAvgScore - olderAvgScore;
    const accuracyTrend = recentAvgAccuracy - olderAvgAccuracy;

    const highestScore = Math.max(...sessions.map((s) => s.score));
    const highestAccuracy = Math.max(...sessions.map((s) => Number(s.accuracy)));

    const consistencyScore =
      1 -
      Math.sqrt(
        sessions.reduce((sum, s) => sum + Math.pow(s.score - recentAvgScore, 2), 0) /
          sessions.length
      ) /
        100;

    const difficultyBreakdown = {
      easy: sessions.filter((s) => s.difficulty_level === 'easy').length,
      medium: sessions.filter((s) => s.difficulty_level === 'medium').length,
      hard: sessions.filter((s) => s.difficulty_level === 'hard').length,
    };

    const playedLastWeek = sessions.filter(
      (s) => new Date(s.completed_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length;

    return {
      scoreTrend,
      accuracyTrend,
      highestScore,
      highestAccuracy,
      consistencyScore: Math.max(0, Math.min(1, consistencyScore)),
      recentAvgScore,
      recentAvgAccuracy,
      difficultyBreakdown,
      playedLastWeek,
    };
  }, [sessions]);

  if (!insights) return null;

  const getTrendEmoji = (value: number) => {
    if (value > 5) return '🚀';
    if (value > 0) return '📈';
    if (value === 0) return '➡️';
    if (value > -5) return '📉';
    return '⚠️';
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-400';
    if (value === 0) return 'text-gray-400';
    return 'text-red-400';
  };

  const getConsistencyLevel = (score: number) => {
    if (score > 0.8) return { text: 'Uitstekend', color: 'text-green-400', emoji: '⭐' };
    if (score > 0.6) return { text: 'Goed', color: 'text-blue-400', emoji: '👍' };
    if (score > 0.4) return { text: 'Gemiddeld', color: 'text-yellow-400', emoji: '🎯' };
    return { text: 'Variabel', color: 'text-orange-400', emoji: '🔄' };
  };

  const consistency = getConsistencyLevel(insights.consistencyScore);

  return (
    <div className="space-y-4">
      <h3 className="text-lg sm:text-xl font-bold text-cyan-400 mb-4">
        Prestatie Inzichten 💡
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Score Trend</span>
            <span className="text-2xl">{getTrendEmoji(insights.scoreTrend)}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {insights.recentAvgScore.toFixed(0)}
            </span>
            <span className="text-sm text-gray-500">gem.</span>
          </div>
          <div className={`text-sm ${getTrendColor(insights.scoreTrend)} mt-1`}>
            {insights.scoreTrend > 0 ? '+' : ''}
            {insights.scoreTrend.toFixed(1)} punten vs. eerder
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Nauwkeurigheid Trend</span>
            <span className="text-2xl">{getTrendEmoji(insights.accuracyTrend)}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {insights.recentAvgAccuracy.toFixed(0)}%
            </span>
            <span className="text-sm text-gray-500">gem.</span>
          </div>
          <div className={`text-sm ${getTrendColor(insights.accuracyTrend)} mt-1`}>
            {insights.accuracyTrend > 0 ? '+' : ''}
            {insights.accuracyTrend.toFixed(1)}% vs. eerder
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Consistentie</span>
            <span className="text-2xl">{consistency.emoji}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${consistency.color}`}>
              {consistency.text}
            </span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Prestatie stabiliteit: {(insights.consistencyScore * 100).toFixed(0)}%
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Deze Week</span>
            <span className="text-2xl">📅</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{insights.playedLastWeek}</span>
            <span className="text-sm text-gray-500">spellen</span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {insights.playedLastWeek >= 5
              ? 'Geweldig! 🎉'
              : insights.playedLastWeek >= 3
                ? 'Goed bezig! 👍'
                : 'Blijf oefenen! 💪'}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border border-pink-500/20 rounded-lg p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">Persoonlijke Records</span>
          <span className="text-2xl">🏆</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500">Hoogste Score</div>
            <div className="text-xl font-bold text-yellow-400">{insights.highestScore}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Beste Nauwkeurigheid</div>
            <div className="text-xl font-bold text-yellow-400">
              {insights.highestAccuracy.toFixed(0)}%
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
