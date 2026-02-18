import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get daily activity for the last 365 days
    const result = await sql`
      SELECT 
        DATE(completed_at) as date,
        COUNT(*) as game_count,
        AVG(score) as avg_score,
        MAX(score) as max_score
      FROM sessions
      WHERE user_id = ${(session.user as any).id}
        AND completed_at >= NOW() - INTERVAL '365 days'
      GROUP BY DATE(completed_at)
      ORDER BY date ASC
    `;

    return NextResponse.json({ activity: result });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}