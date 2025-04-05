const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Firestore reference
const db = admin.firestore();

/**
 * Cloud Function that triggers when a new user is created
 * Adds the user to the users collection with a default role of 'coach'
 */
exports.createUserProfile = functions.auth.user().onCreate(async (user) => {
  try {
    // Create user document with default role
    await db.collection('users').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      role: 'coach', // Default role
      displayName: user.displayName || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`User profile created for ${user.uid}`);
    return null;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
});

/**
 * Function to add a custom claim to a user (for role-based authorization)
 * This could be triggered by an HTTP request in a real-world scenario
 * For example, an admin could promote a coach to an admin role
 */
exports.setUserRole = functions.https.onCall(async (data, context) => {
  // Check if request is made by an authenticated admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  
  // Verify if the caller has admin privileges
  const callerUid = context.auth.uid;
  const callerRef = await db.collection('users').doc(callerUid).get();
  
  if (!callerRef.exists || callerRef.data().role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can modify user roles.'
    );
  }
  
  // Validate parameters
  const { uid, role } = data;
  if (!uid || !role) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with uid and role arguments.'
    );
  }
  
  // Validate role value
  const allowedRoles = ['coach', 'admin'];
  if (!allowedRoles.includes(role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Role must be one of: ${allowedRoles.join(', ')}`
    );
  }
  
  try {
    // Update custom claims
    await admin.auth().setCustomUserClaims(uid, { role });
    
    // Update user record in Firestore
    await db.collection('users').doc(uid).update({
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error setting user role:', error);
    throw new functions.https.HttpsError('internal', 'Error setting user role');
  }
}); 