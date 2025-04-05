import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

/**
 * Register a new user with email and password
 * Also creates a user document in Firestore with role='coach'
 * 
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {object} userData - Additional user data (optional)
 * @returns {Promise<object>} - Firebase user object
 */
export const registerUser = async (email, password, userData = {}) => {
  try {
    // Create the user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create a user document in Firestore with 'coach' role
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      role: 'coach', // Default role
      displayName: userData.displayName || '',
      photoURL: userData.photoURL || '',
      createdAt: serverTimestamp(),
      ...userData
    });
    
    return user;
  } catch (error) {
    console.error('Error during registration:', error);
    throw error;
  }
};

/**
 * Sign in a user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<UserCredential>} Firebase user credential
 */
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

/**
 * Sign out the currently authenticated user
 * @returns {Promise<void>}
 */
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Send a password reset email
 * 
 * @param {string} email - User's email address
 * @returns {Promise<void>}
 */
export const resetPassword = (email) => {
  return sendPasswordResetEmail(auth, email);
};

/**
 * Register a new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @returns {Promise<void>}
 */
export const register = async (email, password, firstName, lastName) => {
  try {
    // Create the user with Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;
    
    // Create a user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      firstName,
      lastName,
      role: 'user', // Default role for new users
      createdAt: new Date().toISOString(),
    });
    
    // Sign out after registration (optional)
    // The user will need to sign in explicitly after registration
    await firebaseSignOut(auth);
    
    return userCredential;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

/**
 * Get a user's role from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<string|null>} User role or null if not found
 */
export const getUserRole = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data().role;
    }
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    throw error;
  }
};

/**
 * Get user profile data from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<Object|null>} User data or null if not found
 */
export const getUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export default {
  registerUser,
  signIn,
  signOut,
  resetPassword,
  register,
  getUserRole,
  getUserProfile
}; 