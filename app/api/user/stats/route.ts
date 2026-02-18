import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserStats, initializeUserStats } from '@/lib/db/queries';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    // Get or initialize stats
    let stats = await getUserStats(userId);
    if (!stats) {
      stats = await initializeUserStats(userId);
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
