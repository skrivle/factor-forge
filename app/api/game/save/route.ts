import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  createSession,
  initializeUserStats,
  updateBestScore,
  incrementCorrectAnswers,
  calculateStreak,
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

    // Calculate correct answers from accuracy
    const totalQuestions = 20; // From config
    const correctAnswers = Math.round((accuracy / 100) * totalQuestions);
    await incrementCorrectAnswers(userId, correctAnswers);

    // Calculate current streak from session data
    const currentStreak = await calculateStreak(userId);

    return NextResponse.json({ 
      success: true,
      streak: currentStreak,
    });
  } catch (error) {
    console.error('Error saving game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
