// Test Render backend deployment
// Run this to verify your backend is working

const BACKEND_URL = 'https://khs-crm-backend.onrender.com'; // Update this with your actual Render URL

async function testBackend() {
  console.log('Testing backend at:', BACKEND_URL);
  console.log('=====================================\n');

  // Test 1: Root endpoint
  try {
    console.log('1. Testing root endpoint...');
    const response = await fetch(`${BACKEND_URL}/`);
    const data = await response.json();
    console.log('✅ Root endpoint:', data);
  } catch (error) {
    console.log('❌ Root endpoint failed:', error.message);
  }

  // Test 2: API Health
  try {
    console.log('\n2. Testing API health...');
    const response = await fetch(`${BACKEND_URL}/api/health`);
    const data = await response.json();
    console.log('✅ API health:', data);
  } catch (error) {
    console.log('❌ API health failed:', error.message);
  }

  // Test 3: Customers API
  try {
    console.log('\n3. Testing customers API...');
    const response = await fetch(`${BACKEND_URL}/api/customers`);
    const data = await response.json();
    console.log('✅ Customers API returned', Array.isArray(data) ? data.length : 0, 'customers');
  } catch (error) {
    console.log('❌ Customers API failed:', error.message);
  }

  // Test 4: Auth endpoint
  try {
    console.log('\n4. Testing auth endpoint...');
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'test' })
    });
    console.log('✅ Auth endpoint responded with status:', response.status);
  } catch (error) {
    console.log('❌ Auth endpoint failed:', error.message);
  }

  console.log('\n=====================================');
  console.log('If you see ✅ for the first 3 tests, your backend is working!');
  console.log('Update your frontend .env with: VITE_API_URL=' + BACKEND_URL);
}

testBackend().catch(console.error);