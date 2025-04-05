const axios = require('axios');

// Base URL for API
const API_BASE_URL = 'http://localhost:5011/api';

// Test getting all athletes
async function testGetAthletes() {
  try {
    console.log('\n--- Testing GET /athletes ---');
    
    const response = await axios.get(`${API_BASE_URL}/athletes`, {
      headers: {
        'x-test-mode': 'bypass-auth'
      }
    });
    
    console.log('API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error testing GET /athletes:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run tests
async function runTests() {
  try {
    console.log('Starting API tests with bypass header...');
    
    // Test GET athletes endpoint
    await testGetAthletes();
    
    console.log('Tests completed.');
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the tests
runTests(); 