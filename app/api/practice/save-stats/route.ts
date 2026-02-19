import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { saveQuestionStats } from '@/lib/db/queries';

// This endpoint saves question stats for adaptive learning purposes only
// It does NOT create a session or update user stats (best_score, streak, etc.)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { 
      questions,
      userAnswers,
      isCorrectAnswers,
      timeTaken,
    } = await req.json();

    if (!questions || !userAnswers || !isCorrectAnswers || !timeTaken) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Save question stats with a null session_id to indicate this is practice-only
    // This allows us to track performance for adaptive learning without affecting stats
    await saveQuestionStats(
      userId,
      null, // null session_id = practice mode, doesn't count toward stats
      questions,
      userAnswers,
      isCorrectAnswers,
      timeTaken
    );

    return NextResponse.json({ 
      success: true,
      message: 'Practice stats saved for adaptive learning',
    });
  } catch (error) {
    console.error('Error saving practice stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
