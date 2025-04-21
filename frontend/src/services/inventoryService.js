import axios from '../axios-config';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Helper function to transform inventory data from API response
const transformInventoryItem = (item) => {
  if (!item) return null;
  
  // Ensure we have an ID
  const id = item.id || item._id || Math.random().toString(36).substring(2, 11);
  
  // Log the raw item for debugging
  console.log('Raw inventory item from Firestore:', item);
  
  return {
    id,
    // For compatibility with both old and new data formats
    itemId: item.itemId || '',
    // Ensure name is set, with proper fallbacks
    name: item.name || item.itemId || 'Unnamed Item',
    description: item.description || '',
    type: item.type || '',
    category: item.category || item.type || '',
    size: item.size || '',
    condition: item.condition || 'Good',
    status: item.status || 'Available',
    location: item.location || '',
    // Handle both field names for athlete assignments
    assignedTo: item.assignedTo || item.athleteId || null,
    assignedToName: item.athleteName || '',
    athleteId: item.assignedTo || item.athleteId || null,
    athleteName: item.athleteName || '',
    notes: item.notes || '',
    lastUpdated: item.lastUpdated ? new Date(item.lastUpdated) : item.updatedAt ? new Date(item.updatedAt) : new Date(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : item.lastUpdated ? new Date(item.lastUpdated) : new Date(),
    addedDate: item.addedDate ? new Date(item.addedDate) : item.createdAt ? new Date(item.createdAt) : new Date(),
    createdAt: item.createdAt ? new Date(item.createdAt) : item.addedDate ? new Date(item.addedDate) : new Date(),
  };
};

/**
 * Get all inventory items
 * @returns {Promise<Array>} Array of inventory items
 */
export const getInventoryItems = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      console.warn('User not authenticated, returning empty inventory');
      return [];
    }
    
    try {
      // Access Firestore directly instead of going through API
      const inventoryCollection = collection(db, 'inventory');
      const snapshot = await getDocs(inventoryCollection);
      
      const inventoryItems = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        inventoryItems.push({
          id: doc.id,
          ...data,
          // Ensure properly formatted dates
          lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : new Date(),
          addedDate: data.addedDate ? new Date(data.addedDate) : new Date()
        });
      });
      
      console.log('Inventory items fetched from Firestore:', inventoryItems);
      
      if (inventoryItems.length > 0) {
        // Transform and return the real data
        const transformedItems = inventoryItems
          .map(item => transformInventoryItem(item))
          .filter(item => item !== null);
        
        return transformedItems;
      }
      
      // If no items found in Firestore, use mock data in development only
      if (process.env.NODE_ENV !== 'production') {
        console.log('No inventory items found in Firestore, using mock data for development');
        return getMockInventoryItems();
      } else {
        // In production, return empty array instead of mock data
        console.log('No inventory items found in Firestore in production');
        return [];
      }
    } catch (error) {
      console.error('Firestore access failed:', error);
      
      // Only use mock data in development
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Using mock data for development after error:', error.message);
        return getMockInventoryItems();
      } else {
        console.error('Error fetching inventory in production:', error.message);
        return [];
      }
    }
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    
    // Only use mock data in development
    if (process.env.NODE_ENV !== 'production') {
      return getMockInventoryItems();
    } else {
      return [];
    }
  }
};

/**
 * Get mock inventory items for development
 * @returns {Array} Array of mock inventory items
 */
const getMockInventoryItems = () => {
  return [
    {
      id: '1',
      name: 'Track Jersey #10',
      itemId: 'U-1001',
      type: 'Uniform',
      category: 'Uniform',
      size: 'M',
      condition: 'Good',
      status: 'Available',
      location: 'Equipment Room',
      athleteId: null,
      athleteName: '',
      notes: '',
      lastUpdated: new Date(),
      addedDate: new Date(new Date().setDate(new Date().getDate() - 30))
    },
    {
      id: '2',
      name: 'Track Jersey #11',
      itemId: 'U-1002',
      type: 'Uniform',
      category: 'Uniform',
      size: 'L',
      condition: 'Excellent',
      status: 'Checked Out',
      location: 'Equipment Room',
      athleteId: 'athlete1',
      athleteName: 'John Smith',
      notes: '',
      lastUpdated: new Date(),
      addedDate: new Date(new Date().setDate(new Date().getDate() - 45))
    },
    {
      id: '3',
      name: 'Running Shoes',
      itemId: 'S-2001',
      type: 'Footwear',
      category: 'Shoes',
      size: '10',
      condition: 'Good',
      status: 'Available',
      location: 'Equipment Room',
      athleteId: null,
      athleteName: '',
      notes: '',
      lastUpdated: new Date(),
      addedDate: new Date(new Date().setDate(new Date().getDate() - 15))
    },
    {
      id: '4',
      name: 'Shot Put',
      itemId: 'E-3001',
      type: 'Field Equipment',
      category: 'Competition Equipment',
      size: '8kg',
      condition: 'Good',
      status: 'Available',
      location: 'Field Storage',
      athleteId: null,
      athleteName: '',
      notes: '',
      lastUpdated: new Date(),
      addedDate: new Date(new Date().setDate(new Date().getDate() - 60))
    },
    {
      id: '5',
      name: 'Relay Baton',
      itemId: 'E-4001',
      type: 'Track Equipment',
      category: 'Competition Equipment',
      size: 'Standard',
      condition: 'Poor',
      status: 'Maintenance',
      location: 'Repair Shop',
      athleteId: null,
      athleteName: '',
      notes: 'Needs to be replaced soon',
      lastUpdated: new Date(),
      addedDate: new Date(new Date().setDate(new Date().getDate() - 90))
    }
  ];
};

/**
 * Get a single inventory item by ID
 * @param {string} id - The ID of the inventory item to fetch
 * @returns {Promise<Object>} The inventory item
 */
export const getInventoryItemById = async (id) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const docRef = doc(db, 'inventory', id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      throw new Error(`Inventory item with ID ${id} not found`);
    }
    
    const data = snapshot.data();
    return transformInventoryItem({
      id: snapshot.id,
      ...data,
      lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : new Date(),
      addedDate: data.addedDate ? new Date(data.addedDate) : new Date()
    });
  } catch (error) {
    console.error(`Error fetching inventory item with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new inventory item
 * @param {Object} itemData - The inventory item data
 * @returns {Promise<Object>} The created inventory item
 */
export const createInventoryItem = async (itemData) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Validate required fields
    if (!itemData.name) {
      throw new Error('Item name is required');
    }
    
    // Ensure timestamps are properly set
    const newItem = {
      ...itemData,
      addedDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    const inventoryCollection = collection(db, 'inventory');
    const docRef = await addDoc(inventoryCollection, newItem);
    
    return transformInventoryItem({
      id: docRef.id,
      ...newItem
    });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    throw error;
  }
};

/**
 * Update an existing inventory item
 * @param {string} id - The ID of the inventory item to update
 * @param {Object} itemData - The updated inventory item data
 * @returns {Promise<Object>} The updated inventory item
 */
export const updateInventoryItem = async (id, itemData) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Update the timestamp
    const updatedItem = {
      ...itemData,
      lastUpdated: new Date().toISOString()
    };
    
    const itemRef = doc(db, 'inventory', id);
    await updateDoc(itemRef, updatedItem);
    
    return transformInventoryItem({
      id,
      ...updatedItem
    });
  } catch (error) {
    console.error(`Error updating inventory item with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete an inventory item
 * @param {string} id - The ID of the inventory item to delete
 * @returns {Promise<void>}
 */
export const deleteInventoryItem = async (id) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const itemRef = doc(db, 'inventory', id);
    await deleteDoc(itemRef);
  } catch (error) {
    console.error(`Error deleting inventory item with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Assign an inventory item to an athlete
 * @param {string} itemId - The ID of the inventory item to assign
 * @param {string} athleteId - The ID of the athlete to assign the item to
 * @returns {Promise<Object>} The updated inventory item
 */
export const assignInventoryItem = async (itemId, athleteId) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Get the current item
    const itemRef = doc(db, 'inventory', itemId);
    const itemSnapshot = await getDoc(itemRef);
    
    if (!itemSnapshot.exists()) {
      throw new Error(`Inventory item with ID ${itemId} not found`);
    }
    
    const updatedData = {
      assignedTo: athleteId || null,
      status: athleteId ? 'Checked Out' : 'Available',
      lastUpdated: new Date().toISOString()
    };
    
    // Update the item
    await updateDoc(itemRef, updatedData);
    
    // If this is a uniform, update the athlete's 'Has Uniform?' field
    if (athleteId && (itemSnapshot.data().category === 'Uniform' || itemSnapshot.data().type === 'Uniform')) {
      const athleteRef = doc(db, 'athletes', athleteId);
      await updateDoc(athleteRef, {
        'Has Uniform?': true
      });
    }
    
    // If we're unassigning from a previous athlete
    const previousAthleteId = itemSnapshot.data().assignedTo;
    if (previousAthleteId && previousAthleteId !== athleteId && 
        (itemSnapshot.data().category === 'Uniform' || itemSnapshot.data().type === 'Uniform')) {
      const athleteRef = doc(db, 'athletes', previousAthleteId);
      await updateDoc(athleteRef, {
        'Has Uniform?': false
      });
    }
    
    return transformInventoryItem({
      id: itemId,
      ...itemSnapshot.data(),
      ...updatedData
    });
  } catch (error) {
    console.error(`Error assigning inventory item ${itemId} to athlete ${athleteId}:`, error);
    throw error;
  }
};

/**
 * Get inventory items assigned to a specific athlete
 * @param {string} athleteId - The ID of the athlete
 * @returns {Promise<Array>} Array of inventory items assigned to the athlete
 */
export const getAthleteInventory = async (athleteId) => {
  try {
    const items = await getInventoryItems();
    return items.filter(item => item.assignedTo === athleteId);
  } catch (error) {
    console.error(`Error fetching inventory for athlete ${athleteId}:`, error);
    throw error;
  }
};

/**
 * Get available inventory items (not assigned to any athlete)
 * @returns {Promise<Array>} Array of available inventory items
 */
export const getAvailableInventory = async () => {
  try {
    const items = await getInventoryItems();
    return items.filter(item => !item.athleteId && item.status === 'Available');
  } catch (error) {
    console.error('Error fetching available inventory:', error);
    throw error;
  }
};

/**
 * Get inventory items that need maintenance or replacement
 * @returns {Promise<Array>} Array of inventory items needing attention
 */
export const getInventoryNeedingAttention = async () => {
  try {
    const items = await getInventoryItems();
    return items.filter(item => 
      item.condition === 'Poor' || 
      item.condition === 'Damaged' || 
      item.notes?.toLowerCase().includes('repair') ||
      item.notes?.toLowerCase().includes('replace')
    );
  } catch (error) {
    console.error('Error fetching inventory needing attention:', error);
    // Return empty array instead of throwing error
    return [];
  }
}; 