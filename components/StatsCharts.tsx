'use client';

import { useMemo } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface GameSession {
  id: string;
  score: number;
  accuracy: number;
  difficulty_level: 'easy' | 'medium' | 'hard';
  completed_at: Date | string;
}

interface StatsChartsProps {
  sessions: GameSession[];
}

export default function StatsCharts({ sessions }: StatsChartsProps) {
  const chartData = useMemo(() => {
    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
    );

    const labels = sortedSessions.map((s, i) => {
      const date = new Date(s.completed_at);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    });

    const scores = sortedSessions.map((s) => s.score);
    const accuracies = sortedSessions.map((s) => Number(s.accuracy));

    // Calculate rolling average (last 5 games)
    const rollingAvgScores = scores.map((_, i) => {
      const start = Math.max(0, i - 4);
      const slice = scores.slice(start, i + 1);
      return slice.reduce((a, b) => a + b, 0) / slice.length;
    });

    // Group by difficulty
    const difficultyStats = {
      easy: { count: 0, totalScore: 0, totalAccuracy: 0 },
      medium: { count: 0, totalScore: 0, totalAccuracy: 0 },
      hard: { count: 0, totalScore: 0, totalAccuracy: 0 },
    };

    sortedSessions.forEach((s) => {
      const diff = s.difficulty_level;
      difficultyStats[diff].count++;
      difficultyStats[diff].totalScore += s.score;
      difficultyStats[diff].totalAccuracy += Number(s.accuracy);
    });

    return {
      labels,
      scores,
      accuracies,
      rollingAvgScores,
      difficultyStats,
    };
  }, [sessions]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#9ca3af',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#6366f1',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#9ca3af',
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        ticks: {
          color: '#9ca3af',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  const scoreData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Score',
        data: chartData.scores,
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Gemiddelde (5 spellen)',
        data: chartData.rollingAvgScores,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  const accuracyData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Nauwkeurigheid (%)',
        data: chartData.accuracies,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const difficultyData = {
    labels: ['Makkelijk', 'Gemiddeld', 'Moeilijk'],
    datasets: [
      {
        label: 'Gemiddelde Score',
        data: [
          chartData.difficultyStats.easy.count > 0
            ? chartData.difficultyStats.easy.totalScore / chartData.difficultyStats.easy.count
            : 0,
          chartData.difficultyStats.medium.count > 0
            ? chartData.difficultyStats.medium.totalScore / chartData.difficultyStats.medium.count
            : 0,
          chartData.difficultyStats.hard.count > 0
            ? chartData.difficultyStats.hard.totalScore / chartData.difficultyStats.hard.count
            : 0,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.5)',
          'rgba(251, 191, 36, 0.5)',
          'rgba(239, 68, 68, 0.5)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(251, 191, 36)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Score Progress */}
      <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-4">
        <h3 className="text-lg sm:text-xl font-bold text-purple-400 mb-4">
          Score Voortgang 📈
        </h3>
        <div className="h-64 sm:h-80">
          <Line data={scoreData} options={chartOptions} />
        </div>
      </div>

      {/* Accuracy Trend */}
      <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg p-4">
        <h3 className="text-lg sm:text-xl font-bold text-blue-400 mb-4">
          Nauwkeurigheid Trend 🎯
        </h3>
        <div className="h-64 sm:h-80">
          <Line data={accuracyData} options={chartOptions} />
        </div>
      </div>

      {/* Performance by Difficulty */}
      <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg p-4">
        <h3 className="text-lg sm:text-xl font-bold text-green-400 mb-4">
          Prestaties per Moeilijkheidsgraad 🎚️
        </h3>
        <div className="h-64 sm:h-80">
          <Bar data={difficultyData} options={chartOptions} />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 text-center">
          <div>
            <div className="text-xs text-gray-400">Makkelijk</div>
            <div className="text-lg font-bold text-green-400">
              {chartData.difficultyStats.easy.count} spellen
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Gemiddeld</div>
            <div className="text-lg font-bold text-yellow-400">
              {chartData.difficultyStats.medium.count} spellen
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Moeilijk</div>
            <div className="text-lg font-bold text-red-400">
              {chartData.difficultyStats.hard.count} spellen
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
