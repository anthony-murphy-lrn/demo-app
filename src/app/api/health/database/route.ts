import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseConnection, getDatabaseStats } from '../../../../lib/database-init';

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    const isConnected = await checkDatabaseConnection();
    
    if (!isConnected) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Database connection failed',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }
    
    // Get database statistics
    const stats = await getDatabaseStats();
    
    return NextResponse.json({
      status: 'healthy',
      message: 'Database connection is working',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        provider: stats.provider,
        path: stats.databasePath,
        stats: {
          sessions: stats.sessions,
          assessmentResults: stats.resultCount,
        }
      }
    });
    
  } catch (error) {
    console.error('Database health check failed:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Database health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
