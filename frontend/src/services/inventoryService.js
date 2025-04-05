import axios from 'axios';
import { auth } from '../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase';
import { getAthletes } from './athleteService';

// API base URL - should be environment variable in production
const API_BASE_URL = 'http://localhost:5011/api';

/**
 * Get all inventory items directly from Firestore
 * Join with athletes data for names
 */
export const getInventoryItems = async () => {
  try {
    // First get all athletes to use for name lookups
    const athletes = await getAthletes();
    const athletesMap = {};
    
    // Create lookup map by ID
    athletes.forEach(athlete => {
      athletesMap[athlete.id] = athlete;
    });
    
    // Get inventory items
    const inventoryCollection = collection(db, 'inventory');
    const snapshot = await getDocs(inventoryCollection);
    
    const items = [];
    snapshot.forEach(doc => {
      const itemData = doc.data();
      const item = {
        id: doc.id,
        ...itemData,
        // If assigned to an athlete, include their name
        assignedToName: itemData.assignedTo && athletesMap[itemData.assignedTo] 
          ? athletesMap[itemData.assignedTo].name 
          : null
      };
      
      items.push(item);
    });
    
    return items;
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    throw error;
  }
};

/**
 * Get a single inventory item with athlete name
 */
export const getInventoryItemById = async (id) => {
  try {
    const docRef = doc(db, 'inventory', id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      throw new Error(`Inventory item with ID ${id} not found`);
    }
    
    const itemData = snapshot.data();
    
    // If assigned to an athlete, get their name
    let assignedToName = null;
    if (itemData.assignedTo) {
      const athleteDocRef = doc(db, 'athletes', itemData.assignedTo);
      const athleteSnapshot = await getDoc(athleteDocRef);
      
      if (athleteSnapshot.exists()) {
        const athleteData = athleteSnapshot.data();
        assignedToName = `${athleteData['First Name'] || ''} ${athleteData['Last Name'] || ''}`.trim();
      }
    }
    
    return {
      id,
      ...itemData,
      assignedToName
    };
  } catch (error) {
    console.error(`Error fetching inventory item with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new inventory item
 */
export const createInventoryItem = async (itemData) => {
  try {
    const { itemId, type, status, assignedTo } = itemData;
    
    // Validate required fields
    if (!itemId || !type || !status) {
      throw new Error('Item ID, type, and status are required');
    }
    
    // Validate status and assignedTo combination
    if (status === 'Checked Out' && !assignedTo) {
      throw new Error('When status is "Checked Out", an athlete must be assigned');
    }
    
    const newItem = {
      itemId,
      type,
      status,
      assignedTo: assignedTo || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add to Firestore
    const inventoryCollection = collection(db, 'inventory');
    const docRef = await addDoc(inventoryCollection, newItem);
    
    // If assigning to an athlete, update the athlete's record
    if (assignedTo) {
      const athleteRef = doc(db, 'athletes', assignedTo);
      await updateDoc(athleteRef, {
        'Has Uniform?': true,
        'Uniform ID': itemId
      });
    }
    
    return {
      id: docRef.id,
      ...newItem,
      assignedToName: null // Will be populated when needed
    };
  } catch (error) {
    console.error('Error creating inventory item:', error);
    throw error;
  }
};

/**
 * Update an existing inventory item
 */
export const updateInventoryItem = async (id, itemData) => {
  try {
    const { itemId, type, status, assignedTo } = itemData;
    
    // Validate required fields
    if (!itemId || !type || !status) {
      throw new Error('Item ID, type, and status are required');
    }
    
    // Get current state
    const docRef = doc(db, 'inventory', id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      throw new Error(`Inventory item with ID ${id} not found`);
    }
    
    const currentData = snapshot.data();
    const previouslyAssignedTo = currentData.assignedTo;
    
    // Validate status and assignedTo combination
    if (status === 'Checked Out' && !assignedTo) {
      throw new Error('When status is "Checked Out", an athlete must be assigned');
    }
    
    // Handle athlete assignment changes
    if (assignedTo !== previouslyAssignedTo) {
      // If previously assigned to someone, clear their uniform
      if (previouslyAssignedTo) {
        const prevAthleteRef = doc(db, 'athletes', previouslyAssignedTo);
        await updateDoc(prevAthleteRef, {
          'Has Uniform?': false,
          'Uniform ID': null
        });
      }
      
      // If newly assigned to someone, update their uniform
      if (assignedTo) {
        const athleteRef = doc(db, 'athletes', assignedTo);
        await updateDoc(athleteRef, {
          'Has Uniform?': true,
          'Uniform ID': itemId
        });
      }
    }
    
    // Update the item
    const updatedItem = {
      itemId,
      type,
      status,
      assignedTo: assignedTo || null,
      updatedAt: new Date()
    };
    
    await updateDoc(docRef, updatedItem);
    
    return {
      id,
      ...updatedItem,
      assignedToName: null // Will be populated when needed
    };
  } catch (error) {
    console.error(`Error updating inventory item with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete an inventory item
 */
export const deleteInventoryItem = async (id) => {
  try {
    // Get the item to check if it's assigned to an athlete
    const docRef = doc(db, 'inventory', id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      throw new Error(`Inventory item with ID ${id} not found`);
    }
    
    const itemData = snapshot.data();
    
    // If assigned to an athlete, clear their uniform
    if (itemData.assignedTo) {
      const athleteRef = doc(db, 'athletes', itemData.assignedTo);
      await updateDoc(athleteRef, {
        'Has Uniform?': false,
        'Uniform ID': null
      });
    }
    
    // Delete the item
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting inventory item with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Special function just for assigning an item to an athlete
 */
export const assignInventoryItem = async (id, assignedTo) => {
  try {
    // Get current state
    const docRef = doc(db, 'inventory', id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      throw new Error(`Inventory item with ID ${id} not found`);
    }
    
    const currentData = snapshot.data();
    const previouslyAssignedTo = currentData.assignedTo;
    
    // Cannot assign if item is not available and not already assigned
    if (currentData.status !== 'Available' && !previouslyAssignedTo) {
      throw new Error('Only available items can be assigned');
    }
    
    // Handle athlete assignment changes
    if (assignedTo !== previouslyAssignedTo) {
      // If previously assigned to someone, clear their uniform
      if (previouslyAssignedTo) {
        const prevAthleteRef = doc(db, 'athletes', previouslyAssignedTo);
        await updateDoc(prevAthleteRef, {
          'Has Uniform?': false,
          'Uniform ID': null
        });
      }
      
      // If newly assigned to someone, update their uniform
      if (assignedTo) {
        const athleteRef = doc(db, 'athletes', assignedTo);
        await updateDoc(athleteRef, {
          'Has Uniform?': true,
          'Uniform ID': currentData.itemId
        });
      }
    }
    
    // Update the inventory item
    const itemData = {
      status: assignedTo ? 'Checked Out' : 'Available',
      assignedTo: assignedTo || null,
      updatedAt: new Date()
    };
    
    await updateDoc(docRef, itemData);
    
    // Get the updated item with athlete name
    const updatedItem = await getInventoryItemById(id);
    
    return updatedItem;
  } catch (error) {
    console.error(`Error assigning inventory item with ID ${id}:`, error);
    throw error;
  }
}; 