#!/usr/bin/env node

/**
 * Script test production endpoints
 * Usage: node scripts/test-production.js https://your-backend.onrender.com
 */

const https = require('https');
const http = require('http');

const BACKEND_URL = process.argv[2];

if (!BACKEND_URL) {
    console.error('❌ Error: Please provide backend URL');
    console.log('Usage: node scripts/test-production.js https://your-backend.onrender.com');
    process.exit(1);
}

console.log('🧪 Testing production backend...');
console.log(`URL: ${BACKEND_URL}\n`);

// Helper function to make HTTP request
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;

        client.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Test 1: Health check
async function testHealth() {
    console.log('1️⃣  Testing health endpoint...');
    try {
        const url = `${BACKEND_URL}/api/health`;
        const response = await makeRequest(url);

        if (response.statusCode === 200) {
            console.log('✅ Health check passed');
            console.log(`   Response: ${response.body}`);
            return true;
        } else {
            console.log(`❌ Health check failed (Status: ${response.statusCode})`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Health check failed: ${error.message}`);
        return false;
    }
}

// Test 2: CORS headers
async function testCORS() {
    console.log('\n2️⃣  Testing CORS headers...');
    try {
        const url = `${BACKEND_URL}/api/health`;
        const response = await makeRequest(url);

        const corsHeader = response.headers['access-control-allow-origin'];
        if (corsHeader) {
            console.log('✅ CORS headers present');
            console.log(`   Origin: ${corsHeader}`);
            return true;
        } else {
            console.log('⚠️  Warning: CORS headers not found');
            return false;
        }
    } catch (error) {
        console.log(`❌ CORS test failed: ${error.message}`);
        return false;
    }
}

// Test 3: API routes
async function testRoutes() {
    console.log('\n3️⃣  Testing API routes...');

    const routes = [
        '/api/health',
        '/api/rooms',
        '/api/users/search?q=test'
    ];

    let passed = 0;

    for (const route of routes) {
        try {
            const url = `${BACKEND_URL}${route}`;
            const response = await makeRequest(url);

            if (response.statusCode < 500) {
                console.log(`✅ ${route} (${response.statusCode})`);
                passed++;
            } else {
                console.log(`❌ ${route} (${response.statusCode})`);
            }
        } catch (error) {
            console.log(`❌ ${route} - ${error.message}`);
        }
    }

    return passed === routes.length;
}

// Test 4: Response time
async function testResponseTime() {
    console.log('\n4️⃣  Testing response time...');
    try {
        const url = `${BACKEND_URL}/api/health`;
        const start = Date.now();
        await makeRequest(url);
        const duration = Date.now() - start;

        console.log(`⏱️  Response time: ${duration}ms`);

        if (duration < 1000) {
            console.log('✅ Response time good');
            return true;
        } else if (duration < 3000) {
            console.log('⚠️  Response time acceptable (might be waking up from sleep)');
            return true;
        } else {
            console.log('❌ Response time too slow');
            return false;
        }
    } catch (error) {
        console.log(`❌ Response time test failed: ${error.message}`);
        return false;
    }
}

// Run all tests
async function runTests() {
    const results = {
        health: await testHealth(),
        cors: await testCORS(),
        routes: await testRoutes(),
        responseTime: await testResponseTime()
    };

    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Results:');
    console.log('='.repeat(50));

    const passed = Object.values(results).filter(r => r).length;
    const total = Object.keys(results).length;

    console.log(`✅ Passed: ${passed}/${total}`);

    if (passed === total) {
        console.log('\n🎉 All tests passed! Production is ready!');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the logs above.');
    }

    console.log('\n📚 Next steps:');
    console.log('1. Test frontend: Open your frontend URL in browser');
    console.log('2. Register a new account');
    console.log('3. Create a room');
    console.log('4. Test chat functionality');
    console.log('5. Test streaming with OBS');
}

// Run
runTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
});
