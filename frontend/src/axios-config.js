import axios from 'axios';

// Set base URL for all requests
axios.defaults.baseURL = process.env.NODE_ENV === 'production' 
  ? '/api' // Use relative path in production 
  : 'http://localhost:5011'; // Use direct URL in development

// Add interceptor to handle authentication errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Authentication error:', error.message);
      // Could redirect to login page or refresh token here
    }
    return Promise.reject(error);
  }
);

export default axios; 