import axios from '../axios-config';
import firebase from '../firebase';
import { getAuth } from 'firebase/auth';

// Helper function to transform inventory data from API response
const transformInventoryItem = (item) => {
  if (!item) return null;
  
  // Ensure we have an ID
  const id = item.id || item._id || Math.random().toString(36).substring(2, 11);
  
  return {
    id,
    // For compatibility with both old and new data formats
    itemId: item.itemId || item.name || '',
    name: item.name || item.itemId || '',
    description: item.description || '',
    type: item.type || '',
    category: item.category || item.type || '',
    size: item.size || '',
    condition: item.condition || 'Good',
    status: item.status || 'Available',
    location: item.location || '',
    // Handle both field names for athlete assignments
    assignedTo: item.athleteId || item.assignedTo || null,
    assignedToName: item.athleteName || '',
    athleteId: item.athleteId || item.assignedTo || null,
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
      const idToken = await user.getIdToken();
      
      const response = await axios.get('/api/inventory', {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        // Transform data and filter out any null items
        const transformedItems = response.data
          .map(item => transformInventoryItem(item))
          .filter(item => item !== null);
        
        console.log('Transformed inventory items from API:', transformedItems);
        
        if (transformedItems.length > 0) {
          return transformedItems;
        }
      }
    } catch (error) {
      console.warn('API call failed, using mock data for development:', error);
    }
    
    // Return mock data for development if API call fails or returns empty
    console.log('Using mock inventory data for development');
    return getMockInventoryItems();
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    // Return empty array instead of throwing error for better UI experience during development
    return getMockInventoryItems();
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
    
    const idToken = await user.getIdToken();
    
    const response = await axios.get(`/api/inventory/${id}`, {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    });
    
    if (response.data) {
      return transformInventoryItem(response.data);
    }
    
    throw new Error('Inventory item not found');
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
    
    const idToken = await user.getIdToken();
    
    // Ensure timestamps are properly set
    const newItem = {
      ...itemData,
      addedDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    const response = await axios.post('/api/inventory', newItem, {
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data) {
      return transformInventoryItem(response.data);
    }
    
    throw new Error('Failed to create inventory item');
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
    
    const idToken = await user.getIdToken();
    
    // Update the lastUpdated timestamp
    const updatedItem = {
      ...itemData,
      lastUpdated: new Date().toISOString()
    };
    
    const response = await axios.put(`/api/inventory/${id}`, updatedItem, {
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data) {
      return transformInventoryItem(response.data);
    }
    
    throw new Error('Failed to update inventory item');
  } catch (error) {
    console.error(`Error updating inventory item with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete an inventory item
 * @param {string} id - The ID of the inventory item to delete
 * @returns {Promise<boolean>} True if the deletion was successful
 */
export const deleteInventoryItem = async (id) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const idToken = await user.getIdToken();
    
    await axios.delete(`/api/inventory/${id}`, {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    });
    
    return true;
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
    
    const idToken = await user.getIdToken();
    
    const response = await axios.put(`/api/inventory/${itemId}/assign`, { athleteId }, {
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data) {
      return transformInventoryItem(response.data);
    }
    
    throw new Error('Failed to assign inventory item');
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
    return items.filter(item => item.athleteId === athleteId);
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