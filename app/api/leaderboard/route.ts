import { NextResponse } from 'next/server';
import { getLeaderboard, getWeeklyLeaderboard } from '@/lib/db/queries';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all-time';

    let data;
    if (type === 'weekly') {
      data = await getWeeklyLeaderboard();
    } else {
      data = await getLeaderboard(10);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
