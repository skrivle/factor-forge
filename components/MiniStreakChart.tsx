'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface ActivityDay {
  date: string | Date;
  game_count: number;
}

interface MiniStreakChartProps {
  activity: ActivityDay[];
  days?: number; // Number of days to show (default 14)
}

export default function MiniStreakChart({ activity, days = 14 }: MiniStreakChartProps) {
  const [hoveredDay, setHoveredDay] = useState<{ date: string; game_count: number } | null>(null);

  // Generate data for the last N days
  const generateDays = () => {
    const result: ({ date: string; game_count: number } | null)[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create activity map for quick lookup
    const activityMap = new Map<string, { date: string; game_count: number }>();
    activity.forEach(day => {
      // Handle both Date objects and strings
      let dateStr: string;
      if (day.date instanceof Date) {
        dateStr = day.date.toISOString().split('T')[0];
      } else if (typeof day.date === 'string') {
        dateStr = day.date.split('T')[0];
      } else {
        // Fallback: convert to string
        dateStr = String(day.date).split('T')[0];
      }
      activityMap.set(dateStr, { date: dateStr, game_count: day.game_count });
    });

    // Generate last N days
    for (let i = days - 1; i >= 0; i--) {
      const currentDate = new Date(today);
      currentDate.setDate(currentDate.getDate() - i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayActivity = activityMap.get(dateStr);
      
      result.push(dayActivity || { date: dateStr, game_count: 0 });
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
          if (!day) return <div key={index} className="w-1.5 h-4 sm:w-2 sm:h-5" />;
          
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
