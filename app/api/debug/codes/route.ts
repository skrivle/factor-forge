import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';

export async function GET() {
  try {
    const codes = await sql`SELECT code, is_used, used_by, created_at FROM invite_codes ORDER BY code`;
    
    return NextResponse.json({ 
      success: true,
      codes,
      count: codes.length
    });
  } catch (error: any) {
    console.error('Error fetching codes:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
