#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

async function setupDatabase() {
  console.log('🔄 Setting up database...');

  try {
    // Create the database connection
    const sql = neon(DATABASE_URL);
    const db = drizzle(sql);

    console.log('📋 Testing database connection...');

    // Test the connection by running a simple query
    await db.execute('SELECT 1');

    console.log('✅ Database connection successful!');
    console.log('📋 Database is ready to use');

    // Note: For a production setup, you would run migrations here
    console.log('💡 Note: To create tables, you can run: npm run db:push');

  } catch (error) {
    console.error('❌ Database setup failed:', error);

    if (error.message.includes('does not exist') || error.message.includes('relation')) {
      console.log('💡 Database exists but tables may not be created yet');
      console.log('   Run: npm run db:push');
    } else {
      console.error('💥 Connection failed. Please check your DATABASE_URL');
      process.exit(1);
    }
  }
}

// Run the setup
setupDatabase();
