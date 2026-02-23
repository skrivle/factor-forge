import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDueFacts, getDueCount, getUserWeakQuestions } from '@/lib/db/queries';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const [dueQuestions, dueCount, weakQuestions] = await Promise.all([
      getDueFacts(userId),
      getDueCount(userId),
      getUserWeakQuestions(userId, 30),
    ]);

    return NextResponse.json({
      dueQuestions,
      dueCount,
      hasEnoughData: dueCount > 0,
      weakQuestions,
    });
  } catch (error) {
    console.error('Error fetching practice data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
