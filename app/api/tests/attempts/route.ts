import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { 
  createTestAttempt, 
  completeTestAttempt, 
  getUserTestAttempt,
  getTestAttempts,
  getTest,
  saveTestQuestionStats,
  updateSrsOnAnswer,
  canAccessGroup
} from '@/lib/db/queries';

// GET /api/tests/attempts - Get test attempts
export async function GET(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role ?? 'child';
    const { searchParams } = new URL(req.url);
    const testId = searchParams.get('testId');

    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
    }

    const test = await getTest(testId);
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }
    const allowed = await canAccessGroup(userId, test.group_id, userRole);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden: test is not in your group' }, { status: 403 });
    }

    // Check if this is a request for a specific user's attempt
    const forUser = searchParams.get('userId');
    
    if (forUser) {
      // Get specific user's attempt (parents can see all, children only their own)
      if (userRole !== 'parent' && userRole !== 'admin' && forUser !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      
      const attempt = await getUserTestAttempt(testId, forUser);
      return NextResponse.json({ attempt });
    }

    // Get all attempts for this test (parent only)
    if (userRole !== 'parent' && userRole !== 'admin') {
      // Children can only see their own attempts
      const attempt = await getUserTestAttempt(testId, userId);
      return NextResponse.json({ attempts: attempt ? [attempt] : [] });
    }

    const attempts = await getTestAttempts(testId);
    return NextResponse.json({ attempts });

  } catch (error) {
    console.error('Error fetching test attempts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tests/attempts - Start or complete a test attempt
export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { testId, action } = body;

    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
    }

    // Get the test details and ensure user can access it (same group)
    const test = await getTest(testId);
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }
    const attemptUserRole = (session.user as any).role ?? 'child';
    const allowed = await canAccessGroup(userId, test.group_id, attemptUserRole);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden: test is not in your group' }, { status: 403 });
    }

    if (action === 'start') {
      // Check if user already has an attempt for this test
      const existingAttempt = await getUserTestAttempt(testId, userId);
      
      if (existingAttempt) {
        // If there's a completed attempt, they can't retake (kid can only fill in once)
        if (existingAttempt.status === 'completed') {
          return NextResponse.json({ 
            error: 'You have already completed this test' 
          }, { status: 400 });
        }
        
        // If there's an in-progress attempt, return it
        return NextResponse.json({ attempt: existingAttempt });
      }

      // Create new attempt
      const attempt = await createTestAttempt(testId, userId, test.question_count);
      return NextResponse.json({ attempt }, { status: 201 });

    } else if (action === 'complete') {
      const { attemptId, score, accuracy, timeTakenSeconds, questions } = body;

      if (!attemptId || score === undefined || accuracy === undefined || !questions) {
        return NextResponse.json({ 
          error: 'Missing required fields: attemptId, score, accuracy, questions' 
        }, { status: 400 });
      }

      // Complete the attempt
      const completedAttempt = await completeTestAttempt(
        attemptId,
        score,
        accuracy,
        timeTakenSeconds || null,
        questions
      );

      // Save individual question stats for smart practice
      try {
        await saveTestQuestionStats(userId, attemptId, questions);
        // Update SRS schedule from test results
        for (const item of questions) {
          const q = item.question;
          if (q && typeof item.isCorrect === 'boolean') {
            await updateSrsOnAnswer(userId, q.num1, q.num2, q.operation, item.isCorrect);
          }
        }
      } catch (error) {
        console.error('Error saving test question stats:', error);
        // Don't fail the request if question stats fail to save
      }

      return NextResponse.json({ attempt: completedAttempt });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error managing test attempt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
