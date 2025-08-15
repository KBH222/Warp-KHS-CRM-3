// Quick API test script
// Usage: node test-api.js [backend-url]

const backendUrl = process.argv[2] || 'http://localhost:3001';

async function testEndpoint(name, url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(`✅ ${name}: ${response.status} ${response.statusText}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`❌ ${name}: Failed - ${error.message}`);
  }
}

async function runTests() {
  console.log(`Testing backend at: ${backendUrl}\n`);

  await testEndpoint('Root endpoint', `${backendUrl}/`);
  await testEndpoint('Health check', `${backendUrl}/api/health`);
  await testEndpoint('Customers API', `${backendUrl}/api/customers`);
  await testEndpoint('Jobs API', `${backendUrl}/api/jobs`);
}

runTests().catch(console.error);