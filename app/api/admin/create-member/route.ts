import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createUser, initializeUserStats, isUserAdminOfGroup, getGroupMembers } from '@/lib/db/queries';

// POST /api/admin/create-member - Create new family member (admin only)
export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const userRole = (session.user as { role: string }).role;
    const body = await req.json();
    const { groupId, name, pin, role } = body;

    if (!groupId || !name || !pin || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate PIN
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
    }

    // Validate role
    if (role !== 'parent' && role !== 'child') {
      return NextResponse.json({ error: 'Invalid role. Can only create parent or child accounts.' }, { status: 400 });
    }

    // Check if user is admin of this group (admins can only manage their own group)
    const isAdmin = await isUserAdminOfGroup(userId, groupId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only the admin of this group can create members' }, { status: 403 });
    }

    // Create new user and add to group immediately
    const newUser = await createUser(name, pin, role, groupId);
    
    // Initialize stats for new user
    await initializeUserStats(newUser.id);

    // Return updated members list
    const members = await getGroupMembers(groupId);
    return NextResponse.json({ 
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        role: newUser.role,
      },
      members 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating member:', error);
    
    if (error.message?.includes('unique')) {
      return NextResponse.json({ 
        error: 'Username already exists' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to create member',
      details: error.message
    }, { status: 500 });
  }
}
