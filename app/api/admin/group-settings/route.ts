import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { 
  getGroup,
  updateGroupSettings,
  isUserAdminOfGroup
} from '@/lib/db/queries';

// PATCH /api/admin/group-settings - Update group settings (admin only)
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const userRole = (session.user as { role: string }).role;
    const body = await req.json();
    const { groupId, supportedTables } = body;

    if (!groupId) {
      return NextResponse.json({ error: 'Missing groupId' }, { status: 400 });
    }

    if (!supportedTables || !Array.isArray(supportedTables) || supportedTables.length === 0) {
      return NextResponse.json({ error: 'Invalid supportedTables' }, { status: 400 });
    }

    // Validate tables are between 1 and 10
    const validTables = supportedTables.every((t: number) => t >= 1 && t <= 10);
    if (!validTables) {
      return NextResponse.json({ error: 'Tables must be between 1 and 10' }, { status: 400 });
    }

    // Check if user is admin of the group
    const isAdmin = await isUserAdminOfGroup(userId, groupId);
    if (!isAdmin && userRole !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update group settings' }, { status: 403 });
    }

    // Update group settings
    await updateGroupSettings(groupId, supportedTables);

    // Return updated group
    const group = await getGroup(groupId);
    return NextResponse.json({ group }, { status: 200 });

  } catch (error) {
    console.error('Error updating group settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
