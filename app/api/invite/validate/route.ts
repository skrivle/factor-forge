import { NextResponse } from 'next/server';
import { validateInviteCode, getInviteCode } from '@/lib/db/invite-queries';

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    
    if (!code) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invite code is required' 
      }, { status: 400 });
    }
    
    const isValid = await validateInviteCode(code);
    
    if (!isValid) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid or already used invite code' 
      }, { status: 400 });
    }
    
    const inviteCode = await getInviteCode(code);
    
    return NextResponse.json({ 
      valid: true,
      code: inviteCode
    });
    
  } catch (error) {
    console.error('Error validating invite code:', error);
    return NextResponse.json({ 
      valid: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
