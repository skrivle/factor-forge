'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActivityDay {
  date: string;
  game_count: number;
  avg_score: number;
  max_score: number;
}

interface ActivityHeatmapProps {
  weeks?: number; // Number of weeks to show (default 52 for 1 year)
}

export default function ActivityHeatmap({ weeks = 52 }: ActivityHeatmapProps) {
  const [activity, setActivity] = useState<ActivityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<ActivityDay | null>(null);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      const response = await fetch('/api/activity');
      const data = await response.json();
      setActivity(data.activity || []);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate grid data for the last N weeks
  const generateGrid = () => {
    const grid: (ActivityDay | null)[][] = [];
    const today = new Date();
    const daysToShow = weeks * 7;
    
    // Start from N weeks ago
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - daysToShow);
    
    // Find the previous Sunday to align the grid
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    // Create activity map for quick lookup
    const activityMap = new Map<string, ActivityDay>();
    activity.forEach(day => {
      activityMap.set(day.date, day);
    });

    // Generate grid (7 rows for days of week, N columns for weeks)
    for (let week = 0; week < weeks; week++) {
      const weekData: (ActivityDay | null)[] = [];
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + (week * 7) + day);
        
        // Don't show future dates
        if (currentDate > today) {
          weekData.push(null);
          continue;
        }

        const dateStr = currentDate.toISOString().split('T')[0];
        const dayActivity = activityMap.get(dateStr);
        
        weekData.push(dayActivity || { date: dateStr, game_count: 0, avg_score: 0, max_score: 0 });
      }
      grid.push(weekData);
    }

    return grid;
  };

  const getIntensityColor = (gameCount: number) => {
    if (gameCount === 0) return 'bg-gray-800/50';
    if (gameCount === 1) return 'bg-green-900/70';
    if (gameCount === 2) return 'bg-green-700/80';
    if (gameCount === 3) return 'bg-green-600/90';
    return 'bg-green-500';
  };

  const grid = generateGrid();
  const dayLabels = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
  
  // Calculate current streak
  const calculateStreak = () => {
    if (activity.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sortedActivity = [...activity].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let streak = 0;
    let checkDate = new Date(today);
    
    for (const day of sortedActivity) {
      const activityDate = new Date(day.date);
      activityDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((checkDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0 || daysDiff === 1) {
        streak++;
        checkDate = activityDate;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const currentStreak = calculateStreak();
  const totalGames = activity.reduce((sum, day) => sum + day.game_count, 0);

  if (loading) {
    return (
      <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg">
        <CardContent className="p-6">
          <div className="text-center text-gray-400">Activiteit laden...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex items-center justify-between">
          <span>Jouw Activiteit 📊</span>
          <div className="text-sm font-normal text-gray-400">
            🔥 {currentStreak} dagen streak
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-400">
          {totalGames} spellen in de afgelopen {weeks} weken
        </div>
        
        <div className="overflow-x-auto pb-2">
          <div className="inline-flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 mr-2">
              <div className="h-3" /> {/* Spacer for alignment */}
              {dayLabels.map((label, i) => (
                <div
                  key={label}
                  className="h-3 text-xs text-gray-500 flex items-center"
                  style={{ opacity: i % 2 === 0 ? 1 : 0 }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            {grid.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {/* Month labels on first row */}
                {weekIndex % 4 === 0 && (
                  <div className="h-3 text-xs text-gray-500 mb-0.5">
                    {week[0] && new Date(week[0].date).toLocaleDateString('nl-NL', { month: 'short' })}
                  </div>
                )}
                {weekIndex % 4 !== 0 && <div className="h-3" />}
                
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return <div key={dayIndex} className="w-3 h-3" />;
                  }
                  
                  return (
                    <motion.div
                      key={dayIndex}
                      className={`w-3 h-3 rounded-sm border border-gray-700/30 cursor-pointer ${getIntensityColor(day.game_count)}`}
                      whileHover={{ scale: 1.3 }}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      title={`${new Date(day.date).toLocaleDateString('nl-NL')}: ${day.game_count} spel${day.game_count !== 1 ? 'len' : ''}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Tooltip */}
        {hoveredDay && hoveredDay.game_count > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm bg-gray-900/95 border border-purple-500/30 rounded p-3"
          >
            <div className="font-bold text-white">
              {new Date(hoveredDay.date).toLocaleDateString('nl-NL', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-gray-400 mt-1">
              🎮 {hoveredDay.game_count} spel{hoveredDay.game_count !== 1 ? 'len' : ''}
            </div>
            {hoveredDay.max_score > 0 && (
              <div className="text-gray-400">
                🏆 Beste score: {Math.round(hoveredDay.max_score)}
              </div>
            )}
          </motion.div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Minder</span>
          <div className="w-3 h-3 rounded-sm bg-gray-800/50 border border-gray-700/30" />
          <div className="w-3 h-3 rounded-sm bg-green-900/70 border border-gray-700/30" />
          <div className="w-3 h-3 rounded-sm bg-green-700/80 border border-gray-700/30" />
          <div className="w-3 h-3 rounded-sm bg-green-600/90 border border-gray-700/30" />
          <div className="w-3 h-3 rounded-sm bg-green-500 border border-gray-700/30" />
          <span>Meer</span>
        </div>
      </CardContent>
    </Card>
  );
}
