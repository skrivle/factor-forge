'use client';

import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';

interface WeakQuestion {
  num1: number;
  num2: number;
  operation: string;
  times_seen: number;
  times_incorrect: number;
  accuracy_rate: number;
}

interface WeakAreasChartProps {
  userId: string;
}

export default function WeakAreasChart({ userId }: WeakAreasChartProps) {
  const [weakQuestions, setWeakQuestions] = useState<WeakQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeakAreas() {
      try {
        const response = await fetch('/api/practice/weak-questions');
        if (response.ok) {
          const data = await response.json();
          setWeakQuestions(data.weakQuestions || []);
        }
      } catch (error) {
        console.error('Error fetching weak questions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchWeakAreas();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-lg p-4">
        <h3 className="text-lg sm:text-xl font-bold text-red-400 mb-4">
          Gebieden voor Verbetering 🎓
        </h3>
        <div className="text-center text-gray-400 py-8">Laden...</div>
      </div>
    );
  }

  if (weakQuestions.length === 0) {
    return (
      <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-lg p-4">
        <h3 className="text-lg sm:text-xl font-bold text-red-400 mb-4">
          Gebieden voor Verbetering 🎓
        </h3>
        <div className="text-center text-gray-400 py-8">
          Geweldig! Geen zwakke punten gevonden. Blijf zo doorgaan! 🌟
        </div>
      </div>
    );
  }

  // Take top 10 weakest questions
  const topWeak = weakQuestions.slice(0, 10);

  const chartData = {
    labels: topWeak.map((q) => {
      const op = q.operation === 'multiplication' ? '×' : '÷';
      return `${q.num1} ${op} ${q.num2}`;
    }),
    datasets: [
      {
        label: 'Nauwkeurigheid (%)',
        data: topWeak.map((q) => (q.accuracy_rate * 100).toFixed(1)),
        backgroundColor: topWeak.map((q) => {
          if (q.accuracy_rate < 0.5) return 'rgba(239, 68, 68, 0.5)';
          if (q.accuracy_rate < 0.75) return 'rgba(251, 191, 36, 0.5)';
          return 'rgba(34, 197, 94, 0.5)';
        }),
        borderColor: topWeak.map((q) => {
          if (q.accuracy_rate < 0.5) return 'rgb(239, 68, 68)';
          if (q.accuracy_rate < 0.75) return 'rgb(251, 191, 36)';
          return 'rgb(34, 197, 94)';
        }),
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#ef4444',
        borderWidth: 1,
        callbacks: {
          afterLabel: function (context: any) {
            const index = context.dataIndex;
            const q = topWeak[index];
            return [
              `Gezien: ${q.times_seen}×`,
              `Fout: ${q.times_incorrect}×`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        ticks: {
          color: '#9ca3af',
          callback: function (value: any) {
            return value + '%';
          },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11,
          },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  return (
    <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-lg p-4">
      <h3 className="text-lg sm:text-xl font-bold text-red-400 mb-4">
        Gebieden voor Verbetering 🎓
      </h3>
      <div className="h-96">
        <Bar data={chartData} options={chartOptions} />
      </div>
      <div className="mt-4 text-center">
        <div className="text-sm text-gray-400">
          Gebruik <span className="text-green-400 font-bold">Slimme Oefening</span> om deze
          vragen te oefenen! 🎯
        </div>
      </div>
    </div>
  );
}
