'use client';

import { motion } from 'framer-motion';

interface GameSession {
  id: string;
  score: number;
  accuracy: string | number; // decimal type from DB returns as string
  difficulty_level: 'easy' | 'medium' | 'hard';
  completed_at: Date | string;
}

interface RecentGamesListProps {
  sessions: GameSession[];
}

export default function RecentGamesList({ sessions }: RecentGamesListProps) {
  const recentGames = sessions.slice(0, 10);

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'hard':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getDifficultyText = (level: string) => {
    switch (level) {
      case 'easy':
        return 'Makkelijk';
      case 'medium':
        return 'Gemiddeld';
      case 'hard':
        return 'Moeilijk';
      default:
        return level;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return `Vandaag ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
    } else if (d.toDateString() === yesterday.toDateString()) {
      return `Gisteren ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
    } else {
      return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border border-indigo-500/20 rounded-lg p-4">
      <h3 className="text-lg sm:text-xl font-bold text-indigo-400 mb-4">
        Recente Spellen 🎮
      </h3>
      <div className="space-y-2">
        {recentGames.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-black/30 border border-white/10 rounded-lg p-3 flex items-center justify-between hover:bg-black/50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs px-2 py-1 rounded border ${getDifficultyColor(game.difficulty_level)}`}
                >
                  {getDifficultyText(game.difficulty_level)}
                </span>
                <span className="text-xs text-gray-500">{formatDate(game.completed_at)}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="text-right">
                <div className="text-xs text-gray-400">Score</div>
                <div className={`text-xl font-bold ${getScoreColor(game.score)}`}>
                  {game.score}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Nauwk.</div>
                <div className="text-xl font-bold text-blue-400">
                  {Math.round(Number(game.accuracy))}%
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {sessions.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          Nog geen spellen gespeeld. Begin nu! 🚀
        </div>
      )}
    </div>
  );
}
