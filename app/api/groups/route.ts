import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createGroup, getGroup, addUserToGroup, getGroupMembers, canAccessGroup } from '@/lib/db/queries';
import { sql } from '@/lib/db/client';

// GET /api/groups - Get group information
export async function GET(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role ?? 'child';
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');

    if (groupId) {
      const allowed = await canAccessGroup(userId, groupId, userRole);
      if (!allowed) {
        return NextResponse.json({ error: 'Forbidden: not a member of this group' }, { status: 403 });
      }
      const group = await getGroup(groupId);
      if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }
      
      const members = await getGroupMembers(groupId);
      return NextResponse.json({ group, members });
    }

    // Get user's group
    const userResult = await sql`
      SELECT group_id FROM users WHERE id = ${userId}
    `;

    if (!userResult[0] || !userResult[0].group_id) {
      return NextResponse.json({ group: null, members: [] });
    }

    const group = await getGroup(userResult[0].group_id);
    const members = await getGroupMembers(userResult[0].group_id);

    return NextResponse.json({ group, members });

  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/groups - Create a new group (parent only)
export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    
    if (userRole !== 'parent') {
      return NextResponse.json({ error: 'Only parents can create groups' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { name, userIds } = body;

    if (!name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    // Create the group
    const group = await createGroup(name);

    // Add users to the group
    if (userIds && Array.isArray(userIds)) {
      for (const uid of userIds) {
        await addUserToGroup(uid, group.id);
      }
    } else {
      // Add the creating parent to the group by default
      await addUserToGroup(userId, group.id);
    }

    return NextResponse.json({ group }, { status: 201 });

  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
