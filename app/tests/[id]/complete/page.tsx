'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, List } from 'lucide-react';

export default function TestCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const score = parseInt(searchParams?.get('score') || '0');
  const total = parseInt(searchParams?.get('total') || '0');
  const percentage = total > 0 ? (score / total) * 100 : 0;

  const getEmoji = (pct: number) => {
    if (pct >= 90) return '🌟';
    if (pct >= 75) return '🎉';
    if (pct >= 60) return '👍';
    if (pct >= 50) return '💪';
    return '📚';
  };

  const getMessage = (pct: number) => {
    if (pct >= 90) return 'Fantastisch! Perfect gedaan!';
    if (pct >= 75) return 'Super goed gedaan!';
    if (pct >= 60) return 'Goed bezig!';
    if (pct >= 50) return 'Blijf oefenen, je kunt het!';
    return 'Oefening baart kunst. Probeer het nog eens!';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-4 flex items-center justify-center">
      <Card className="border-2 border-purple-500/30 bg-black/80 backdrop-blur-lg w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="text-8xl mb-4">{getEmoji(percentage)}</div>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent mb-2">
            Test Voltooid!
          </CardTitle>
          <p className="text-xl text-gray-300">
            {getMessage(percentage)}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-lg p-8 text-center">
            <div className="text-6xl font-bold text-white mb-2">
              {score} / {total}
            </div>
            <div className="text-2xl text-gray-300">
              {percentage.toFixed(0)}% Correct
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.push('/tests')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xl h-14"
            >
              <List className="mr-2 h-5 w-5" />
              Terug naar Tests
            </Button>

            <Button
              onClick={() => router.push('/')}
              variant="ghost"
              className="w-full text-gray-300 hover:text-white text-lg"
            >
              <Home className="mr-2 h-5 w-5" />
              Naar Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
