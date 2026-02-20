'use client';

import { motion } from 'framer-motion';

interface Stats {
  best_score?: number;
  total_correct_answers?: number;
  current_streak?: number;
}

interface ProgressOverviewProps {
  stats: Stats;
  totalSessions: number;
}

export default function ProgressOverview({ stats, totalSessions }: ProgressOverviewProps) {
  const statCards = [
    {
      label: 'Huidige Reeks',
      value: stats?.current_streak || 0,
      color: 'orange',
      gradient: 'from-orange-500/20 to-orange-600/10',
      border: 'border-orange-500/30',
      textColor: 'text-orange-400',
      icon: (stats?.current_streak || 0) >= 3 ? '🔥' : '📅',
    },
    {
      label: 'Beste Score',
      value: stats?.best_score || 0,
      color: 'green',
      gradient: 'from-green-500/20 to-green-600/10',
      border: 'border-green-500/30',
      textColor: 'text-green-400',
      icon: '🏆',
    },
    {
      label: 'Totaal Correct',
      value: stats?.total_correct_answers || 0,
      color: 'purple',
      gradient: 'from-purple-500/20 to-purple-600/10',
      border: 'border-purple-500/30',
      textColor: 'text-purple-400',
      icon: '✅',
    },
    {
      label: 'Spellen Gespeeld',
      value: totalSessions,
      color: 'blue',
      gradient: 'from-blue-500/20 to-blue-600/10',
      border: 'border-blue-500/30',
      textColor: 'text-blue-400',
      icon: '🎮',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.1 }}
          className={`bg-gradient-to-br ${stat.gradient} border ${stat.border} rounded-lg p-3 sm:p-4 text-center`}
        >
          <div className="text-2xl sm:text-3xl mb-1">{stat.icon}</div>
          <div className="text-xs sm:text-sm text-gray-400 mb-1">{stat.label}</div>
          <div className={`text-2xl sm:text-3xl font-bold ${stat.textColor}`}>
            {stat.value}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
