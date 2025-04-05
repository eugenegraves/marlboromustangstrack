import axios from 'axios';
import { auth } from '../firebase';
import { getFirestore, collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

// API base URL - should be environment variable in production
const API_BASE_URL = 'http://localhost:5011/api';

// Helper functions to transform data between formats
const transformAthleteFromFirestore = (doc) => {
  const data = doc.data() || {};
  return {
    id: doc.id,
    name: `${data['First Name'] || ''} ${data['Last Name'] || ''}`.trim(),
    group: getGroupName(data.Group || 1), // Convert number to group name, default to 1
    uniformID: data['Has Uniform?'] === true ? 'Assigned' : null, // Explicit check for boolean true
    // Include original fields for reference
    firstName: data['First Name'] || '',
    lastName: data['Last Name'] || '',
    groupId: data.Group || 1,
    hasUniform: Boolean(data['Has Uniform?'])
  };
};

const getGroupName = (groupId) => {
  const groups = {
    1: 'Elite Sprinters',
    2: 'Intermediate Sprinters',
    3: 'Beginner Sprinters',
    4: 'Elite Distance',
    5: 'Intermediate Distance',
    6: 'Beginner Distance',
    7: 'Elite Throwers',
    8: 'Intermediate Throwers',
    9: 'Beginner Throwers',
    10: 'Elite Jumpers',
    11: 'Intermediate Jumpers',
    12: 'Beginner Jumpers'
  };
  
  return groups[groupId] || 'Unknown Group';
};

const getGroupId = (groupName) => {
  const groupMapping = {
    'Elite Sprinters': 1,
    'Intermediate Sprinters': 2,
    'Beginner Sprinters': 3,
    'Elite Distance': 4,
    'Intermediate Distance': 5,
    'Beginner Distance': 6,
    'Elite Throwers': 7,
    'Intermediate Throwers': 8,
    'Beginner Throwers': 9,
    'Elite Jumpers': 10,
    'Intermediate Jumpers': 11,
    'Beginner Jumpers': 12
  };
  
  return groupMapping[groupName] || 1; // Default to 1 if not found
};

/**
 * Get all athletes from Firestore directly
 * @returns {Promise<Array>} Array of athlete objects
 */
export const getAthletes = async () => {
  try {
    const athletesCollection = collection(db, 'athletes');
    const snapshot = await getDocs(athletesCollection);
    
    const athletes = [];
    snapshot.forEach(doc => {
      athletes.push(transformAthleteFromFirestore(doc));
    });
    
    return athletes;
  } catch (error) {
    console.error('Error fetching athletes:', error);
    throw error;
  }
};

/**
 * Get a single athlete by ID
 * @param {string} id - Athlete ID
 * @returns {Promise<Object>} Athlete data
 */
export const getAthleteById = async (id) => {
  try {
    const docRef = doc(db, 'athletes', id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      throw new Error(`Athlete with ID ${id} not found`);
    }
    
    return transformAthleteFromFirestore(snapshot);
  } catch (error) {
    console.error(`Error fetching athlete with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new athlete
 * @param {Object} athleteData - Data for the new athlete
 * @returns {Promise<Object>} Created athlete data with ID
 */
export const createAthlete = async (athleteData) => {
  try {
    const { name, group } = athleteData;
    
    // Parse the name into first and last name
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Convert group name to number
    const groupId = getGroupId(group);
    
    // Create data in Firestore format
    const newAthlete = {
      'First Name': firstName,
      'Last Name': lastName,
      'Group': groupId,
      'Has Uniform?': false
    };
    
    const athletesCollection = collection(db, 'athletes');
    const docRef = await addDoc(athletesCollection, newAthlete);
    
    return {
      id: docRef.id,
      name,
      group,
      uniformID: null,
      firstName,
      lastName,
      groupId,
      hasUniform: false
    };
  } catch (error) {
    console.error('Error creating athlete:', error);
    throw error;
  }
};

/**
 * Update an existing athlete
 * @param {string} id - Athlete ID
 * @param {Object} athleteData - Updated athlete data
 * @returns {Promise<Object>} Updated athlete data
 */
export const updateAthlete = async (id, athleteData) => {
  try {
    const { name, group } = athleteData;
    
    // First get the current data to preserve uniform status
    const docRef = doc(db, 'athletes', id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      throw new Error(`Athlete with ID ${id} not found`);
    }
    
    const currentData = snapshot.data();
    
    // Parse the name into first and last name
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Convert group name to number
    const groupId = getGroupId(group);
    
    // Update data in Firestore format
    const updatedAthlete = {
      'First Name': firstName,
      'Last Name': lastName,
      'Group': groupId,
      'Has Uniform?': currentData['Has Uniform?'] || false
    };
    
    await updateDoc(docRef, updatedAthlete);
    
    return {
      id,
      name,
      group,
      uniformID: currentData['Has Uniform?'] ? 'Assigned' : null,
      firstName,
      lastName,
      groupId,
      hasUniform: currentData['Has Uniform?'] || false
    };
  } catch (error) {
    console.error(`Error updating athlete with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete an athlete by ID
 * @param {string} id - Athlete ID
 * @returns {Promise<void>} 
 */
export const deleteAthlete = async (id) => {
  try {
    const docRef = doc(db, 'athletes', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting athlete with ID ${id}:`, error);
    throw error;
  }
};