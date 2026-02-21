import { NextResponse } from 'next/server';
import { createUser, initializeUserStats, createGroup, updateGroupSettings } from '@/lib/db/queries';
import { validateInviteCode, markInviteCodeUsed } from '@/lib/db/invite-queries';

export async function POST(req: Request) {
  try {
    const { name, pin, inviteCode, groupName, selectedTables } = await req.json();
    
    // Validate inputs
    if (!name || !pin || !inviteCode || !groupName || !selectedTables) {
      return NextResponse.json({ 
        error: 'All fields are required' 
      }, { status: 400 });
    }
    
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json({ 
        error: 'PIN must be exactly 4 digits' 
      }, { status: 400 });
    }

    if (selectedTables.length === 0) {
      return NextResponse.json({ 
        error: 'Select at least one table' 
      }, { status: 400 });
    }
    
    // Validate invite code
    const isValidCode = await validateInviteCode(inviteCode);
    if (!isValidCode) {
      return NextResponse.json({ 
        error: 'Invalid or already used invite code' 
      }, { status: 400 });
    }
    
    // Create group first
    const group = await createGroup(groupName);
    
    // Update group with selected tables
    await updateGroupSettings(group.id, selectedTables.sort((a: number, b: number) => a - b));
    
    // Create user as admin and add to group
    const user = await createUser(name, pin, 'admin', group.id);
    
    // Mark invite code as used
    await markInviteCodeUsed(inviteCode, user.id);
    
    // Initialize user stats
    await initializeUserStats(user.id);
    
    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      group: {
        id: group.id,
        name: group.name,
      },
      message: 'Account and group created successfully!'
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating user:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    
    if (error.message?.includes('unique')) {
      return NextResponse.json({ 
        error: 'Username already exists' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to create account',
      details: error.message
    }, { status: 500 });
  }
}
