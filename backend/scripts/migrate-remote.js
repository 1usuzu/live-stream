#!/usr/bin/env node

/**
 * Script để chạy migration cho remote database (Supabase, Render, etc.)
 * 
 * Usage:
 *   node scripts/migrate-remote.js "postgresql://user:pass@host:5432/db"
 * 
 * Hoặc:
 *   DATABASE_URL="postgresql://..." node scripts/migrate-remote.js
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Lấy connection string từ argument hoặc environment
const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ Error: DATABASE_URL is required!');
    console.log('\nUsage:');
    console.log('  node scripts/migrate-remote.js "postgresql://user:pass@host:5432/db"');
    console.log('\nOr:');
    console.log('  DATABASE_URL="postgresql://..." node scripts/migrate-remote.js');
    process.exit(1);
}

// Ẩn password trong log
const safeUrl = connectionString.replace(/:[^:@]+@/, ':****@');
console.log('🔗 Connecting to:', safeUrl);

// Create database connection
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        console.log('🚀 Starting remote database migration...\n');

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

        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Split by semicolons and execute each statement
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`📝 Found ${statements.length} SQL statements\n`);

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ';';
            const preview = statement.substring(0, 50).replace(/\s+/g, ' ');

            process.stdout.write(`⏳ [${i + 1}/${statements.length}] ${preview}...`);

            try {
                await pool.query(statement);
                console.log(' ✅');
                successCount++;
            } catch (error) {
                if (error.message.includes('already exists')) {
                    console.log(' ⚠️  (already exists)');
                    skipCount++;
                } else {
                    console.log(' ❌');
                    console.error(`   Error: ${error.message}`);
                    errorCount++;
                }
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('📊 Migration Summary:');
        console.log(`   ✅ Success: ${successCount}`);
        console.log(`   ⚠️  Skipped: ${skipCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log('='.repeat(50));

        if (errorCount > 0) {
            console.log('\n⚠️  Migration completed with errors');
            await pool.end();
            process.exit(1);
        } else {
            console.log('\n✅ Migration completed successfully!');
            await pool.end();
            process.exit(0);
        }
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        await pool.end();
        process.exit(1);
    }
}

runMigration();
