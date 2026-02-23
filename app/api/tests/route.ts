import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createTest, getGroupTests, getTest, deleteTest, canAccessGroup, getUserGroupId } from '@/lib/db/queries';

// GET /api/tests - Get all tests for user's group
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

    // If testId is provided, get specific test (must be in user's group)
    if (testId) {
      const test = await getTest(testId);
      if (!test) {
        return NextResponse.json({ error: 'Test not found' }, { status: 404 });
      }
      const allowed = await canAccessGroup(userId, test.group_id, userRole);
      if (!allowed) {
        return NextResponse.json({ error: 'Forbidden: test is not in your group' }, { status: 403 });
      }
      return NextResponse.json(test);
    }

    const userGroupId = await getUserGroupId(userId);
    if (!userGroupId) {
      return NextResponse.json({ tests: [] });
    }

    const tests = await getGroupTests(userGroupId);
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
    
    if (userRole !== 'parent' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Only parents and admins can create tests' }, { status: 403 });
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

    const userRoleForGroup = (session.user as any).role ?? 'child';
    const canCreateInGroup = await canAccessGroup(userId, groupId, userRoleForGroup);
    if (!canCreateInGroup) {
      return NextResponse.json({ error: 'Forbidden: you can only create tests for your own group' }, { status: 403 });
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
    
    if (userRole !== 'parent' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Only parents and admins can delete tests' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const testId = searchParams.get('testId');

    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
    }

    const test = await getTest(testId);
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }
    const userRoleForDelete = (session.user as any).role ?? 'child';
    const canDelete = await canAccessGroup(userId, test.group_id, userRoleForDelete);
    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden: you can only delete tests in your own group' }, { status: 403 });
    }

    await deleteTest(testId);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
