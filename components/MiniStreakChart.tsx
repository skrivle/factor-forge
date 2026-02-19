'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface ActivityEntry {
  timestamp: string;
}

interface MiniStreakChartProps {
  activity: ActivityEntry[];
  days?: number; // Number of days to show (default 14)
}

export default function MiniStreakChart({ activity, days = 14 }: MiniStreakChartProps) {
  const [hoveredDay, setHoveredDay] = useState<{ date: string; game_count: number } | null>(null);

  // Generate data for the last N days
  const generateDays = () => {
    const result: ({ date: string; game_count: number })[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Group activity by local date
    const activityMap = new Map<string, number>();
    activity.forEach(entry => {
      // Convert UTC timestamp to local date
      const localDate = new Date(entry.timestamp);
      localDate.setHours(0, 0, 0, 0);
      const dateStr = localDate.toISOString().split('T')[0];
      activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
    });

    // Generate last N days
    for (let i = days - 1; i >= 0; i--) {
      const currentDate = new Date(today);
      currentDate.setDate(currentDate.getDate() - i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const gameCount = activityMap.get(dateStr) || 0;
      
      result.push({ date: dateStr, game_count: gameCount });
    }

    return result;
  };

  const getIntensityColor = (gameCount: number) => {
    if (gameCount === 0) return 'bg-gray-700/30';
    if (gameCount === 1) return 'bg-green-800/70';
    if (gameCount === 2) return 'bg-green-600/80';
    return 'bg-green-500/90';
  };

  const daysData = generateDays();

  return (
    <div className="relative">
      <div className="flex gap-0.5 sm:gap-1">
        {daysData.map((day, index) => {
          return (
            <motion.div
              key={index}
              className={`w-1.5 h-4 sm:w-2 sm:h-5 rounded-sm ${getIntensityColor(day.game_count)}`}
              whileHover={{ scale: 1.2 }}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
            />
          );
        })}
      </div>
      
      {/* Tooltip for desktop only */}
      {hoveredDay && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden sm:block absolute top-full mt-2 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900/95 border border-purple-500/30 rounded px-2 py-1 text-xs whitespace-nowrap"
        >
          <div className="text-gray-300">
            {new Date(hoveredDay.date).toLocaleDateString('nl-NL', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
          <div className="text-gray-400">
            {hoveredDay.game_count} spel{hoveredDay.game_count !== 1 ? 'len' : ''}
          </div>
        </motion.div>
      )}
    </div>
  );
}
