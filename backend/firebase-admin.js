const admin = require('firebase-admin');

// This is a placeholder for the service account key
// In production, you would use environment variables or a secure configuration
// to store these credentials
// const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin SDK
// When deploying, replace this with actual credentials
const initializeFirebaseAdmin = () => {
  // For development without service account key file:
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  return admin;
};

module.exports = { initializeFirebaseAdmin }; 