/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

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
    await db.collection("users").doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      role: "coach", // Default role
      displayName: user.displayName || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`User profile created for ${user.uid}`);
    return null;
  } catch (error) {
    console.error("Error creating user profile:", error);
    return null;
  }
});
