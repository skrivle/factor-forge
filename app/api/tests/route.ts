import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createTest, getGroupTests, getTest, deleteTest } from '@/lib/db/queries';

// GET /api/tests - Get all tests for user's group
export async function GET(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const testId = searchParams.get('testId');

    // If testId is provided, get specific test
    if (testId) {
      const test = await getTest(testId);
      if (!test) {
        return NextResponse.json({ error: 'Test not found' }, { status: 404 });
      }
      return NextResponse.json(test);
    }

    // Get user to find their group
    const userResult = await fetch(`${req.url.split('/api')[0]}/api/user/profile`, {
      headers: req.headers,
    });
    
    if (!userResult.ok) {
      return NextResponse.json({ error: 'Could not fetch user profile' }, { status: 500 });
    }

    const userData = await userResult.json();
    
    if (!userData.group_id) {
      return NextResponse.json({ tests: [] });
    }

    const tests = await getGroupTests(userData.group_id);
    return NextResponse.json({ tests });

  } catch (error) {
    console.error('Error fetching tests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tests - Create a new test (parent only)
export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    
    if (userRole !== 'parent') {
      return NextResponse.json({ error: 'Only parents can create tests' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    
    const { 
      groupId, 
      title, 
      description, 
      questionCount, 
      tablesIncluded, 
      includeDivision, 
      timeLimitSeconds 
    } = body;

    // Validate required fields
    if (!groupId || !title || !questionCount || !tablesIncluded || !Array.isArray(tablesIncluded)) {
      return NextResponse.json({ 
        error: 'Missing required fields: groupId, title, questionCount, tablesIncluded' 
      }, { status: 400 });
    }

    // Validate question count
    if (questionCount < 1 || questionCount > 100) {
      return NextResponse.json({ 
        error: 'Question count must be between 1 and 100' 
      }, { status: 400 });
    }

    // Validate tables
    if (tablesIncluded.length === 0) {
      return NextResponse.json({ 
        error: 'At least one multiplication table must be selected' 
      }, { status: 400 });
    }

    const test = await createTest(
      groupId,
      userId,
      title,
      questionCount,
      tablesIncluded,
      includeDivision || false,
      timeLimitSeconds || null,
      description || null
    );

    return NextResponse.json({ test }, { status: 201 });

  } catch (error) {
    console.error('Error creating test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/tests - Delete a test (parent only)
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    
    if (userRole !== 'parent') {
      return NextResponse.json({ error: 'Only parents can delete tests' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const testId = searchParams.get('testId');

    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
    }

    await deleteTest(testId);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
