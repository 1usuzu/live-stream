#!/usr/bin/env node

/**
 * Script kiểm tra readiness trước khi deploy
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking deployment readiness...\n');

let errors = 0;
let warnings = 0;

// Check 1: Git status
console.log('📦 Checking Git status...');
try {
    const { execSync } = require('child_process');
    const status = execSync('git status --porcelain', { encoding: 'utf8' });

    if (status.trim()) {
        console.log('⚠️  Warning: You have uncommitted changes');
        console.log(status);
        warnings++;
    } else {
        console.log('✅ Git working directory clean');
    }
} catch (error) {
    console.log('⚠️  Warning: Could not check git status');
    warnings++;
}

// Check 2: Backend package.json
console.log('\n📦 Checking backend/package.json...');
const backendPackage = path.join(__dirname, '../backend/package.json');
if (fs.existsSync(backendPackage)) {
    const pkg = JSON.parse(fs.readFileSync(backendPackage, 'utf8'));

    if (pkg.scripts && pkg.scripts.start) {
        console.log('✅ Backend start script found');
    } else {
        console.log('❌ Error: Backend start script missing');
        errors++;
    }

    if (pkg.scripts && pkg.scripts['migrate:remote']) {
        console.log('✅ Migration script found');
    } else {
        console.log('⚠️  Warning: migrate:remote script missing');
        warnings++;
    }
} else {
    console.log('❌ Error: backend/package.json not found');
    errors++;
}

// Check 3: Frontend package.json
console.log('\n📦 Checking frontend/package.json...');
const frontendPackage = path.join(__dirname, '../frontend/package.json');
if (fs.existsSync(frontendPackage)) {
    const pkg = JSON.parse(fs.readFileSync(frontendPackage, 'utf8'));

    if (pkg.scripts && pkg.scripts.build) {
        console.log('✅ Frontend build script found');
    } else {
        console.log('❌ Error: Frontend build script missing');
        errors++;
    }
} else {
    console.log('❌ Error: frontend/package.json not found');
    errors++;
}

// Check 4: Environment files
console.log('\n🔐 Checking environment files...');
const envExample = path.join(__dirname, '../.env.example');
if (fs.existsSync(envExample)) {
    console.log('✅ .env.example exists');
} else {
    console.log('⚠️  Warning: .env.example not found');
    warnings++;
}

const backendEnvExample = path.join(__dirname, '../backend/.env.production.example');
if (fs.existsSync(backendEnvExample)) {
    console.log('✅ backend/.env.production.example exists');
} else {
    console.log('⚠️  Warning: backend/.env.production.example not found');
    warnings++;
}

// Check 5: Database schema
console.log('\n🗄️  Checking database schema...');
const schema = path.join(__dirname, '../backend/db/schema.sql');
if (fs.existsSync(schema)) {
    console.log('✅ Database schema found');
} else {
    console.log('❌ Error: backend/db/schema.sql not found');
    errors++;
}

// Check 6: Migration scripts
console.log('\n🔄 Checking migration scripts...');
const migrateRemote = path.join(__dirname, '../backend/scripts/migrate-remote.js');
if (fs.existsSync(migrateRemote)) {
    console.log('✅ migrate-remote.js found');
} else {
    console.log('❌ Error: backend/scripts/migrate-remote.js not found');
    errors++;
}

// Check 7: Dockerfiles
console.log('\n🐳 Checking Dockerfiles...');
const backendDockerfile = path.join(__dirname, '../backend/Dockerfile');
const frontendDockerfile = path.join(__dirname, '../frontend/Dockerfile');

if (fs.existsSync(backendDockerfile)) {
    console.log('✅ backend/Dockerfile found');
} else {
    console.log('⚠️  Warning: backend/Dockerfile not found');
    warnings++;
}

if (fs.existsSync(frontendDockerfile)) {
    console.log('✅ frontend/Dockerfile found');
} else {
    console.log('⚠️  Warning: frontend/Dockerfile not found');
    warnings++;
}

// Check 8: .gitignore
console.log('\n🚫 Checking .gitignore...');
const gitignore = path.join(__dirname, '../.gitignore');
if (fs.existsSync(gitignore)) {
    const content = fs.readFileSync(gitignore, 'utf8');

    if (content.includes('.env')) {
        console.log('✅ .env files are ignored');
    } else {
        console.log('❌ Error: .env files not in .gitignore');
        errors++;
    }

    if (content.includes('node_modules')) {
        console.log('✅ node_modules are ignored');
    } else {
        console.log('⚠️  Warning: node_modules not in .gitignore');
        warnings++;
    }
} else {
    console.log('⚠️  Warning: .gitignore not found');
    warnings++;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Summary:');
console.log('='.repeat(50));

if (errors === 0 && warnings === 0) {
    console.log('✅ All checks passed! Ready to deploy! 🚀');
    process.exit(0);
} else {
    if (errors > 0) {
        console.log(`❌ ${errors} error(s) found - Please fix before deploying`);
    }
    if (warnings > 0) {
        console.log(`⚠️  ${warnings} warning(s) found - Review before deploying`);
    }

    console.log('\n📚 Next steps:');
    console.log('1. Fix all errors');
    console.log('2. Review warnings');
    console.log('3. Read DEPLOY_GUIDE.md');
    console.log('4. Follow DEPLOY_CHECKLIST.md');

    process.exit(errors > 0 ? 1 : 0);
}
