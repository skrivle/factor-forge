import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserWeakQuestions } from '@/lib/db/queries';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    // Get the user's weak questions (questions they struggle with)
    const weakQuestions = await getUserWeakQuestions(userId, 30);

    return NextResponse.json({ 
      weakQuestions,
      hasEnoughData: weakQuestions.length >= 5, // Need at least 5 weak questions for practice
    });
  } catch (error) {
    console.error('Error fetching weak questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
