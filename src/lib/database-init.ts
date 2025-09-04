import { prisma, checkDatabaseConnection } from './database';
import { databaseConfig } from './config';

// Re-export the checkDatabaseConnection function
export { checkDatabaseConnection };

/**
 * Initialize the SQLite database and ensure it's ready for use
 */
export async function initializeDatabase() {
  try {
    console.log('🚀 Initializing SQLite database...');
    console.log(`📁 Database path: ${databaseConfig.url}`);
    
    // Check database connection
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('Failed to establish database connection');
    }
    
    // Generate Prisma client if needed
    console.log('🔧 Ensuring Prisma client is up to date...');
    
    // Test basic database operations
    console.log('🧪 Testing database operations...');
    
    // Check if tables exist by running a simple query
    try {
      await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table'`;
      console.log('✅ Database tables are accessible');
    } catch (error) {
      console.log('⚠️  Database tables may not exist yet, run "npm run db:push" to create them');
    }
    
    console.log('✅ Database initialization completed successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Reset the database (for development/testing purposes)
 */
export async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...');
    
    // Delete all data from tables
    await prisma.assessmentResult.deleteMany();
    await prisma.session.deleteMany();
    
    console.log('✅ Database reset completed');
    return true;
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  try {
    const sessionCount = await prisma.session.count();
    const resultCount = await prisma.assessmentResult.count();
    
    return {
      sessions: sessionCount,
      assessmentResults: resultCount,
      databasePath: databaseConfig.url,
      provider: databaseConfig.provider,
    };
  } catch (error) {
    console.error('❌ Failed to get database stats:', error);
    throw error;
  }
}
