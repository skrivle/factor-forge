import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db/client';

// DELETE /api/admin/delete-group - Delete entire group and all associated data
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
    const confirmText = searchParams.get('confirm');

    if (!groupId) {
      return NextResponse.json({ error: 'Missing groupId' }, { status: 400 });
    }

    // Verify user is admin of the group
    const userCheck = await sql`
      SELECT role, group_id FROM users WHERE id = ${userId}
    `;
    
    if (userCheck.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userCheck[0];
    
    if (user.group_id !== groupId || user.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Only admins of this group can delete it' 
      }, { status: 403 });
    }

    // Require confirmation
    if (confirmText !== 'DELETE') {
      return NextResponse.json({ 
        error: 'Confirmation text must be "DELETE"' 
      }, { status: 400 });
    }

    // Get all user IDs in this group for deletion
    const groupUsers = await sql`
      SELECT id FROM users WHERE group_id = ${groupId}
    `;
    
    const userIds = groupUsers.map((u: any) => u.id);

    // Delete in correct order to respect foreign keys
    
    // 1. Delete question stats (references sessions and users)
    if (userIds.length > 0) {
      await sql`
        DELETE FROM question_stats 
        WHERE user_id = ANY(${userIds}::uuid[])
      `;
    }

    // 2. Delete sessions (references users)
    if (userIds.length > 0) {
      await sql`
        DELETE FROM sessions 
        WHERE user_id = ANY(${userIds}::uuid[])
      `;
    }

    // 3. Delete user stats (references users)
    if (userIds.length > 0) {
      await sql`
        DELETE FROM user_stats 
        WHERE user_id = ANY(${userIds}::uuid[])
      `;
    }

    // 4. Delete test attempts (references tests and users)
    const groupTests = await sql`
      SELECT id FROM tests WHERE group_id = ${groupId}
    `;
    const testIds = groupTests.map((t: any) => t.id);
    
    if (testIds.length > 0) {
      await sql`
        DELETE FROM test_attempts 
        WHERE test_id = ANY(${testIds}::uuid[])
      `;
    }

    // 5. Delete tests (references group)
    await sql`
      DELETE FROM tests WHERE group_id = ${groupId}
    `;

    // 6. Clear invite code references (set to null, don't delete codes)
    if (userIds.length > 0) {
      await sql`
        UPDATE invite_codes 
        SET created_by = NULL 
        WHERE created_by = ANY(${userIds}::uuid[])
      `;
      
      await sql`
        UPDATE invite_codes 
        SET used_by = NULL 
        WHERE used_by = ANY(${userIds}::uuid[])
      `;
    }

    // 7. Delete users in the group
    await sql`
      DELETE FROM users WHERE group_id = ${groupId}
    `;

    // 8. Finally, delete the group itself
    await sql`
      DELETE FROM groups WHERE id = ${groupId}
    `;

    return NextResponse.json({ 
      success: true,
      message: 'Group and all associated data deleted successfully',
      deletedUsers: userIds.length,
      deletedTests: testIds.length,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ 
      error: 'Failed to delete group',
      details: error.message
    }, { status: 500 });
  }
}
