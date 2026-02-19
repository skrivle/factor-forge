import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db/client';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all sessions for the last 365 days with timestamps
    // Client will group by date in local timezone
    const result = await sql`
      SELECT 
        completed_at,
        score
      FROM sessions
      WHERE user_id = ${(session.user as any).id}
        AND completed_at >= NOW() - INTERVAL '365 days'
      ORDER BY completed_at ASC
    `;

    // Return raw sessions with timestamps
    const sessions = result.map((row: any) => ({
      timestamp: row.completed_at instanceof Date ? row.completed_at.toISOString() : row.completed_at,
      score: Number(row.score)
    }));

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}