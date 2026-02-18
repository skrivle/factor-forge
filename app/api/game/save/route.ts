import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  createSession,
  initializeUserStats,
  updateBestScore,
  incrementCorrectAnswers,
  updateStreak,
  getUserStats,
} from '@/lib/db/queries';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { score, accuracy, difficultyLevel } = await req.json();

    if (typeof score !== 'number' || typeof accuracy !== 'number') {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Save game session
    await createSession(userId, score, accuracy, difficultyLevel);

    // Initialize stats if they don't exist
    await initializeUserStats(userId);

    // Update best score
    await updateBestScore(userId, score);

    // Get current stats to calculate streak
    const stats = await getUserStats(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let newStreak = 1;
    if (stats?.last_played_date) {
      const lastPlayed = new Date(stats.last_played_date);
      lastPlayed.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - lastPlayed.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        // Same day - keep streak
        newStreak = stats.current_streak;
      } else if (daysDiff === 1) {
        // Yesterday - increment streak
        newStreak = stats.current_streak + 1;
      } else {
        // More than 1 day - reset streak
        newStreak = 1;
      }
    }

    await updateStreak(userId, newStreak, today);

    // Calculate correct answers from accuracy
    const totalQuestions = 20; // From config
    const correctAnswers = Math.round((accuracy / 100) * totalQuestions);
    await incrementCorrectAnswers(userId, correctAnswers);

    return NextResponse.json({ 
      success: true,
      streak: newStreak,
    });
  } catch (error) {
    console.error('Error saving game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
