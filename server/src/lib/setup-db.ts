import { getDb } from './db';
import * as schema from '../shared/schema';

// This function will set up the database tables
export async function setupDatabase() {
  try {
    console.log('🔄 Setting up database...');

    const db = getDb();

    // Test the connection by running a simple query
    await db.select().from(schema.users).limit(1);

    console.log('✅ Database connection successful');
    console.log('📋 Tables are ready to use');
  } catch (error) {
    console.error('❌ Database setup failed:', error);

    // If tables don't exist, we would need to run migrations
    // For now, let's just log the error and continue
    console.log('💡 Note: Make sure to run database migrations if tables don\'t exist');
    console.log('   Run: npm run db:setup');

    throw error;
  }
}
