import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getLeaderboard, getWeeklyLeaderboard, canAccessGroup, getUserGroupId } from '@/lib/db/queries';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role ?? 'child';
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all-time';
    const groupIdParam = searchParams.get('groupId');

    // If requesting a specific group, user must be in that group (or app admin)
    let groupId: string | null = null;
    if (groupIdParam) {
      const allowed = await canAccessGroup(userId, groupIdParam, userRole);
      if (!allowed) {
        return NextResponse.json({ error: 'Forbidden: not a member of this group' }, { status: 403 });
      }
      groupId = groupIdParam;
    } else {
      // No groupId: use user's group for scoped view, or null for global
      groupId = await getUserGroupId(userId);
    }

    let data;
    if (type === 'weekly') {
      data = await getWeeklyLeaderboard(groupId);
    } else {
      data = await getLeaderboard(10, groupId);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
