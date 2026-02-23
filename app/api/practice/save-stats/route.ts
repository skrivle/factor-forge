import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { saveQuestionStats, updateSrsOnAnswer } from '@/lib/db/queries';

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
    await saveQuestionStats(
      userId,
      null,
      questions,
      userAnswers,
      isCorrectAnswers,
      timeTaken
    );
    // Update SRS schedule for each question
    for (let i = 0; i < questions.length; i++) {
      await updateSrsOnAnswer(
        userId,
        questions[i].num1,
        questions[i].num2,
        questions[i].operation,
        isCorrectAnswers[i]
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Practice stats saved for adaptive learning',
    });
  } catch (error) {
    console.error('Error saving practice stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
