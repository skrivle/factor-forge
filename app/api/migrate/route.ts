import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore - CommonJS module
const { runMigrations, showMigrationStatus } = require('@/lib/db/migrations');

/**
 * Migration API endpoint
 * 
 * GET  /api/migrate?status=true  - Show migration status
 * POST /api/migrate              - Run pending migrations
 * 
 * This endpoint should be protected in production!
 * Consider adding authentication or removing in production.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showStatus = searchParams.get('status') === 'true';

    if (showStatus) {
      // Capture console output
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.join(' '));

      await showMigrationStatus();

      console.log = originalLog;

      return NextResponse.json({
        success: true,
        output: logs.join('\n')
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Use POST to run migrations, or GET with ?status=true to see status'
    });

  } catch (error) {
    console.error('Migration status failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // In production, you should add authentication here
    // For example, check for an admin token or use NextAuth
    
    // Example: Require a secret token in production
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('authorization');
      const expectedToken = process.env.MIGRATION_SECRET;
      
      if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Capture console output
    const logs: string[] = [];
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      originalLog(...args);
      logs.push(args.join(' '));
    };
    console.error = (...args) => {
      originalError(...args);
      logs.push('ERROR: ' + args.join(' '));
    };

    await runMigrations();

    console.log = originalLog;
    console.error = originalError;

    return NextResponse.json({
      success: true,
      message: 'Migrations completed successfully',
      output: logs.join('\n')
    });

  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
