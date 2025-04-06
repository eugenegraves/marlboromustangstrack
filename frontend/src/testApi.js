import axios from './axios-config';

/**
 * Simple test function to check if the inventory API is accessible
 */
const testInventoryApi = async () => {
  try {
    console.log('Testing inventory API...');
    
    // Test the test endpoint (doesn't require auth)
    const testResponse = await axios.get('/api/inventory/test');
    console.log('Test endpoint response:', testResponse.data);
    
    console.log('API test completed successfully');
    return true;
  } catch (error) {
    console.error('API test failed:', error.message);
    console.error('Full error:', error);
    return false;
  }
};

export default testInventoryApi; 