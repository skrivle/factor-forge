import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db/client';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userIds = searchParams.get('userIds')?.split(',') || [];
    const days = parseInt(searchParams.get('days') || '14');

    if (userIds.length === 0) {
      return NextResponse.json({ activities: {} });
    }

    // Get activity for multiple users for the last N days
    const result = await sql`
      SELECT 
        user_id,
        DATE(completed_at) as date,
        COUNT(*) as game_count
      FROM sessions
      WHERE user_id = ANY(${userIds}::uuid[])
        AND completed_at >= NOW() - INTERVAL '1 day' * ${days}
      GROUP BY user_id, DATE(completed_at)
      ORDER BY user_id, date ASC
    `;

    // Group by user_id
    const activities: Record<string, any[]> = {};
    result.forEach((row: any) => {
      if (!activities[row.user_id]) {
        activities[row.user_id] = [];
      }
      activities[row.user_id].push({
        date: row.date,
        game_count: row.game_count
      });
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}
