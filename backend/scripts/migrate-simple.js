#!/usr/bin/env node

/**
 * Simple migration script - Execute entire schema at once
 * 
 * Usage:
 *   node scripts/migrate-simple.js "postgresql://user:pass@host:5432/db"
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ Error: DATABASE_URL is required!');
    console.log('\nUsage:');
    console.log('  node scripts/migrate-simple.js "postgresql://user:pass@host:5432/db"');
    process.exit(1);
}

const safeUrl = connectionString.replace(/:[^:@]+@/, ':****@');
console.log('🔗 Connecting to:', safeUrl);

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        console.log('🚀 Starting database migration...\n');

        // Test connection
        console.log('⏳ Testing connection...');
        await pool.query('SELECT NOW()');
        console.log('✅ Connection successful!\n');

        // Read schema file
        const schemaPath = path.join(__dirname, '../db/schema.sql');

        if (!fs.existsSync(schemaPath)) {
            console.error('❌ Schema file not found:', schemaPath);
            process.exit(1);
        }

        console.log('📝 Reading schema file...');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('⏳ Executing schema (this may take a moment)...\n');

        try {
            // Execute entire schema at once
            await pool.query(schema);
            console.log('✅ Schema executed successfully!');
        } catch (error) {
            // Check if errors are just "already exists"
            if (error.message.includes('already exists') ||
                error.message.includes('duplicate')) {
                console.log('⚠️  Some objects already exist (this is normal)');
                console.log('✅ Migration completed!');
            } else {
                throw error;
            }
        }

        await pool.end();
        console.log('\n🎉 Database is ready!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        await pool.end();
        process.exit(1);
    }
}

runMigration();
