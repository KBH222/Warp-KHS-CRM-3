// Quick API test script
// Usage: node test-api.js [backend-url]

const backendUrl = process.argv[2] || 'http://localhost:3001';

async function testEndpoint(name, url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    );
  } catch (error) {
    console.error(`❌ ${name}: Failed - ${error.message}`);
  }
}

async function runTests() {
  await testEndpoint('Root endpoint', `${backendUrl}/`);
  await testEndpoint('Health check', `${backendUrl}/api/health`);
  await testEndpoint('Customers API', `${backendUrl}/api/customers`);
  await testEndpoint('Jobs API', `${backendUrl}/api/jobs`);
}

runTests().catch(console.error);