import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDueCount } from '@/lib/db/queries';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const dueCount = await getDueCount(userId);

    return NextResponse.json({
      learningNeeded: dueCount > 0,
      dueCount,
    });
  } catch (error) {
    console.error('Error fetching learning status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
