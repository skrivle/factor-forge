import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { 
  getGroupMembers, 
  addUserToGroup, 
  removeUserFromGroup,
  getUsersNotInGroup,
  isUserAdminOfGroup
} from '@/lib/db/queries';

// POST /api/admin/members - Add member to group (admin only)
export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const userRole = (session.user as { role: string }).role;
    const body = await req.json();
    const { groupId, userIdToAdd } = body;

    if (!groupId || !userIdToAdd) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user is admin of the group
    const isAdmin = await isUserAdminOfGroup(userId, groupId);
    if (!isAdmin && userRole !== 'admin') {
      return NextResponse.json({ error: 'Only admins can add members' }, { status: 403 });
    }

    // Add user to group
    await addUserToGroup(userIdToAdd, groupId);

    // Return updated members list
    const members = await getGroupMembers(groupId);
    return NextResponse.json({ members }, { status: 200 });

  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/members - Remove member from group (admin only)
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const userRole = (session.user as { role: string }).role;
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');
    const userIdToRemove = searchParams.get('userId');

    if (!groupId || !userIdToRemove) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user is admin of the group
    const isAdmin = await isUserAdminOfGroup(userId, groupId);
    if (!isAdmin && userRole !== 'admin') {
      return NextResponse.json({ error: 'Only admins can remove members' }, { status: 403 });
    }

    // Prevent removing self if they're the only admin
    if (userId === userIdToRemove) {
      return NextResponse.json({ error: 'Cannot remove yourself from the group' }, { status: 400 });
    }

    // Remove user from group
    await removeUserFromGroup(userIdToRemove);

    // Return updated members list
    const members = await getGroupMembers(groupId);
    return NextResponse.json({ members }, { status: 200 });

  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/admin/members - Get available users to add
export async function GET(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const userRole = (session.user as { role: string }).role;
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json({ error: 'Missing groupId' }, { status: 400 });
    }

    // Check if user is admin of the group
    const isAdmin = await isUserAdminOfGroup(userId, groupId);
    if (!isAdmin && userRole !== 'admin') {
      return NextResponse.json({ error: 'Only admins can view available members' }, { status: 403 });
    }

    // Get users not in any group
    const availableUsers = await getUsersNotInGroup();
    return NextResponse.json({ users: availableUsers }, { status: 200 });

  } catch (error) {
    console.error('Error fetching available members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
