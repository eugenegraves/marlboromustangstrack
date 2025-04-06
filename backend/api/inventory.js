const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { checkAuth } = require('../middleware/auth');

/**
 * @route   GET /api/inventory/test
 * @desc    Test endpoint to verify API is working
 * @access  Public
 */
router.get('/test', (req, res) => {
  res.json({ message: 'Inventory API is working!' });
});

// Get all inventory items
router.get('/', checkAuth, async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('inventory').get();
    const inventoryItems = [];
    
    // For items with assignedTo, we need to get the athlete's name
    const promises = [];
    
    snapshot.forEach(doc => {
      const itemData = doc.data();
      const item = {
        id: doc.id,
        ...itemData,
        assignedToName: null // Default value
      };
      
      // If the item is assigned to an athlete, fetch the athlete's data
      if (itemData.assignedTo) {
        const promise = admin.firestore()
          .collection('athletes')
          .doc(itemData.assignedTo)
          .get()
          .then(athleteDoc => {
            if (athleteDoc.exists) {
              const athleteData = athleteDoc.data();
              item.assignedToName = `${athleteData['First Name'] || ''} ${athleteData['Last Name'] || ''}`.trim();
            }
            return item;
          })
          .catch(error => {
            console.error(`Error fetching athlete ${itemData.assignedTo}:`, error);
            return item;
          });
        
        promises.push(promise);
      } else {
        // Item not assigned to anyone
        inventoryItems.push(item);
      }
    });
    
    // Wait for all athlete lookups to complete
    const assignedItems = await Promise.all(promises);
    
    // Combine assigned and unassigned items
    const allItems = [...inventoryItems, ...assignedItems];
    
    res.status(200).json(allItems);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

// Get a single inventory item
router.get('/:id', checkAuth, async (req, res) => {
  try {
    const docRef = admin.firestore().collection('inventory').doc(req.params.id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    const itemData = doc.data();
    const item = {
      id: doc.id,
      ...itemData,
      assignedToName: null // Default value
    };
    
    // If the item is assigned to an athlete, fetch the athlete's data
    if (itemData.assignedTo) {
      const athleteDoc = await admin.firestore()
        .collection('athletes')
        .doc(itemData.assignedTo)
        .get();
      
      if (athleteDoc.exists) {
        const athleteData = athleteDoc.data();
        item.assignedToName = `${athleteData['First Name'] || ''} ${athleteData['Last Name'] || ''}`.trim();
      }
    }
    
    res.status(200).json(item);
  } catch (error) {
    console.error(`Error fetching inventory item ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch inventory item' });
  }
});

// Create a new inventory item
router.post('/', checkAuth, async (req, res) => {
  try {
    const { itemId, type, status, assignedTo } = req.body;
    
    // Validate required fields
    if (!itemId || !type || !status) {
      return res.status(400).json({ error: 'Item ID, type, and status are required' });
    }
    
    // If status is "Available", assignedTo should be null
    // If status is "Checked Out", assignedTo should be a valid athlete ID
    if (status === 'Checked Out' && !assignedTo) {
      return res.status(400).json({ 
        error: 'When status is "Checked Out", an athlete must be assigned' 
      });
    }
    
    // If assigning to an athlete, verify the athlete exists
    if (assignedTo) {
      const athleteDoc = await admin.firestore()
        .collection('athletes')
        .doc(assignedTo)
        .get();
      
      if (!athleteDoc.exists) {
        return res.status(400).json({ error: 'Selected athlete does not exist' });
      }
    }
    
    const itemData = {
      itemId,
      type,
      status,
      assignedTo: assignedTo || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Create the inventory item
    const docRef = await admin.firestore().collection('inventory').add(itemData);
    
    // If assigning to an athlete, update the athlete's record
    if (assignedTo) {
      await admin.firestore()
        .collection('athletes')
        .doc(assignedTo)
        .update({
          'Has Uniform?': true,
          'Uniform ID': itemId
        });
    }
    
    res.status(201).json({
      id: docRef.id,
      ...itemData,
      assignedToName: null // Will be populated on the frontend if needed
    });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
});

// Update an inventory item
router.put('/:id', checkAuth, async (req, res) => {
  try {
    const itemId = req.params.id;
    const { itemId: newItemId, type, status, assignedTo } = req.body;
    
    // Validate required fields
    if (!newItemId || !type || !status) {
      return res.status(400).json({ error: 'Item ID, type, and status are required' });
    }
    
    // Get the current state of the item
    const docRef = admin.firestore().collection('inventory').doc(itemId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    const currentData = doc.data();
    const previouslyAssignedTo = currentData.assignedTo;
    
    // If status is "Checked Out", assignedTo should be a valid athlete ID
    if (status === 'Checked Out' && !assignedTo) {
      return res.status(400).json({ 
        error: 'When status is "Checked Out", an athlete must be assigned' 
      });
    }
    
    // Handle athlete assignment changes
    if (assignedTo !== previouslyAssignedTo) {
      // If previously assigned to someone, clear their uniform
      if (previouslyAssignedTo) {
        await admin.firestore()
          .collection('athletes')
          .doc(previouslyAssignedTo)
          .update({
            'Has Uniform?': false,
            'Uniform ID': null
          });
      }
      
      // If newly assigned to someone, update their uniform
      if (assignedTo) {
        const athleteDoc = await admin.firestore()
          .collection('athletes')
          .doc(assignedTo)
          .get();
        
        if (!athleteDoc.exists) {
          return res.status(400).json({ error: 'Selected athlete does not exist' });
        }
        
        await admin.firestore()
          .collection('athletes')
          .doc(assignedTo)
          .update({
            'Has Uniform?': true,
            'Uniform ID': newItemId
          });
      }
    }
    
    // Update the inventory item
    const itemData = {
      itemId: newItemId,
      type,
      status,
      assignedTo: assignedTo || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await docRef.update(itemData);
    
    // Get athlete name if assigned
    let assignedToName = null;
    if (assignedTo) {
      const athleteDoc = await admin.firestore()
        .collection('athletes')
        .doc(assignedTo)
        .get();
      
      if (athleteDoc.exists) {
        const athleteData = athleteDoc.data();
        assignedToName = `${athleteData['First Name'] || ''} ${athleteData['Last Name'] || ''}`.trim();
      }
    }
    
    res.status(200).json({
      id: itemId,
      ...itemData,
      assignedToName
    });
  } catch (error) {
    console.error(`Error updating inventory item ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
});

// Delete an inventory item
router.delete('/:id', checkAuth, async (req, res) => {
  try {
    const itemId = req.params.id;
    
    // Get the item to check if it's assigned to an athlete
    const docRef = admin.firestore().collection('inventory').doc(itemId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    const itemData = doc.data();
    
    // If assigned to an athlete, clear their uniform
    if (itemData.assignedTo) {
      await admin.firestore()
        .collection('athletes')
        .doc(itemData.assignedTo)
        .update({
          'Has Uniform?': false,
          'Uniform ID': null
        });
    }
    
    // Delete the inventory item
    await docRef.delete();
    
    res.status(200).json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error(`Error deleting inventory item ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
});

// Special endpoint just for assigning an item to an athlete
router.put('/:id/assign', checkAuth, async (req, res) => {
  try {
    const itemId = req.params.id;
    const { assignedTo } = req.body;
    
    // Get the current state of the item
    const docRef = admin.firestore().collection('inventory').doc(itemId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    const currentData = doc.data();
    const previouslyAssignedTo = currentData.assignedTo;
    
    // Cannot assign if item is not available
    if (currentData.status !== 'Available' && !previouslyAssignedTo) {
      return res.status(400).json({ 
        error: 'Only available items can be assigned' 
      });
    }
    
    // Handle athlete assignment changes
    if (assignedTo !== previouslyAssignedTo) {
      // If previously assigned to someone, clear their uniform
      if (previouslyAssignedTo) {
        await admin.firestore()
          .collection('athletes')
          .doc(previouslyAssignedTo)
          .update({
            'Has Uniform?': false,
            'Uniform ID': null
          });
      }
      
      // If newly assigned to someone, update their uniform
      if (assignedTo) {
        const athleteDoc = await admin.firestore()
          .collection('athletes')
          .doc(assignedTo)
          .get();
        
        if (!athleteDoc.exists) {
          return res.status(400).json({ error: 'Selected athlete does not exist' });
        }
        
        await admin.firestore()
          .collection('athletes')
          .doc(assignedTo)
          .update({
            'Has Uniform?': true,
            'Uniform ID': currentData.itemId
          });
      }
    }
    
    // Update the inventory item
    const itemData = {
      status: assignedTo ? 'Checked Out' : 'Available',
      assignedTo: assignedTo || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await docRef.update(itemData);
    
    // Get athlete name if assigned
    let assignedToName = null;
    if (assignedTo) {
      const athleteDoc = await admin.firestore()
        .collection('athletes')
        .doc(assignedTo)
        .get();
      
      if (athleteDoc.exists) {
        const athleteData = athleteDoc.data();
        assignedToName = `${athleteData['First Name'] || ''} ${athleteData['Last Name'] || ''}`.trim();
      }
    }
    
    res.status(200).json({
      id: itemId,
      ...currentData,
      ...itemData,
      assignedToName
    });
  } catch (error) {
    console.error(`Error assigning inventory item ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to assign inventory item' });
  }
});

module.exports = router; 