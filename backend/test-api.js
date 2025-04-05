const axios = require('axios');
const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccountKey.json');

// Initialize Firebase Admin if not initialized
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// Base URL for API
const API_BASE_URL = 'http://localhost:5011/api';

// Function to generate a test token
async function generateTestToken() {
  try {
    // Create a custom token
    const uid = 'test-user-123';
    const customToken = await admin.auth().createCustomToken(uid);
    
    console.log('Custom token created successfully:', customToken);
    return customToken;
  } catch (error) {
    console.error('Error creating custom token:', error);
    throw error;
  }
}

// Test getting all athletes
async function testGetAthletes() {
  try {
    console.log('\n--- Testing GET /athletes ---');
    
    // Accessing Firestore directly to check the data
    console.log('Checking Firestore directly:');
    const snapshot = await admin.firestore().collection('athletes').get();
    const athletes = [];
    
    snapshot.forEach(doc => {
      athletes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Found ${athletes.length} athletes in Firestore:`);
    console.log(athletes);
    
    // Now test the API endpoint
    console.log('\nTesting API endpoint:');
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

// Test creating a new athlete
async function testCreateAthlete() {
  try {
    console.log('\n--- Testing POST /athletes ---');
    
    const newAthlete = {
      name: `Test Athlete ${Math.floor(Math.random() * 1000)}`,
      group: 'Elite Sprinters',
      uniformID: `U${Math.floor(Math.random() * 100)}`
    };
    
    console.log('Creating athlete:', newAthlete);
    
    const response = await axios.post(`${API_BASE_URL}/athletes`, newAthlete, {
      headers: {
        'Content-Type': 'application/json',
        'x-test-mode': 'bypass-auth'
      }
    });
    console.log('API Response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error testing POST /athletes:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run tests
async function runTests() {
  try {
    console.log('Starting API tests...');
    
    // Test endpoints without auth token first
    await testGetAthletes();
    await testCreateAthlete();
    
    // Close Firebase app at the end
    await admin.app().delete();
    console.log('Tests completed.');
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the tests
runTests(); 