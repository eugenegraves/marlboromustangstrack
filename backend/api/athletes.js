const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { checkAuth } = require('../middleware/auth');

// Get all athletes
router.get('/', checkAuth, async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection('athletes').get();
    const athletes = [];
    
    snapshot.forEach(doc => {
      // Transform the data to match the frontend expected format
      const data = doc.data();
      athletes.push({
        id: doc.id,
        name: `${data['First Name'] || ''} ${data['Last Name'] || ''}`.trim(),
        group: getGroupName(data.Group), // Convert number to group name
        uniformID: data['Has Uniform?'] ? 'Assigned' : null,
        // Include original fields for reference
        firstName: data['First Name'],
        lastName: data['Last Name'],
        groupId: data.Group,
        hasUniform: data['Has Uniform?']
      });
    });
    
    res.status(200).json(athletes);
  } catch (error) {
    console.error('Error fetching athletes:', error);
    res.status(500).json({ error: 'Failed to fetch athletes' });
  }
});

// Get a single athlete
router.get('/:id', checkAuth, async (req, res) => {
  try {
    const doc = await admin.firestore().collection('athletes').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Athlete not found' });
    }
    
    // Transform the data to match the frontend expected format
    const data = doc.data();
    const athlete = {
      id: doc.id,
      name: `${data['First Name'] || ''} ${data['Last Name'] || ''}`.trim(),
      group: getGroupName(data.Group), // Convert number to group name
      uniformID: data['Has Uniform?'] ? 'Assigned' : null,
      // Include original fields for reference
      firstName: data['First Name'],
      lastName: data['Last Name'],
      groupId: data.Group,
      hasUniform: data['Has Uniform?']
    };
    
    res.status(200).json(athlete);
  } catch (error) {
    console.error('Error fetching athlete:', error);
    res.status(500).json({ error: 'Failed to fetch athlete' });
  }
});

// Add a new athlete
router.post('/', checkAuth, async (req, res) => {
  try {
    const { name, group } = req.body;
    
    // Basic validation
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Parse the name into first and last name
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Convert group name to number
    const groupId = getGroupId(group);
    
    // Create new athlete document with the correct field structure
    const athleteData = {
      'First Name': firstName,
      'Last Name': lastName,
      'Group': groupId,
      'Has Uniform?': false, // Default to false for new athletes
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await admin.firestore().collection('athletes').add(athleteData);
    
    // Return the data in the frontend expected format
    res.status(201).json({
      id: docRef.id,
      name: `${firstName} ${lastName}`.trim(),
      group: group,
      uniformID: null,
      firstName,
      lastName,
      groupId,
      hasUniform: false
    });
  } catch (error) {
    console.error('Error adding athlete:', error);
    res.status(500).json({ error: 'Failed to add athlete' });
  }
});

// Update an existing athlete
router.put('/:id', checkAuth, async (req, res) => {
  try {
    const { name, group } = req.body;
    const athleteId = req.params.id;
    
    // Basic validation
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Check if athlete exists
    const athleteRef = admin.firestore().collection('athletes').doc(athleteId);
    const doc = await athleteRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Athlete not found' });
    }
    
    // Parse the name into first and last name
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Convert group name to number
    const groupId = getGroupId(group);
    
    // Current data
    const currentData = doc.data();
    
    // Update athlete document with the correct field structure
    const athleteData = {
      'First Name': firstName,
      'Last Name': lastName,
      'Group': groupId,
      // Keep the current uniform status
      'Has Uniform?': currentData['Has Uniform?'] || false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await athleteRef.update(athleteData);
    
    // Return the data in the frontend expected format
    res.status(200).json({
      id: athleteId,
      name: `${firstName} ${lastName}`.trim(),
      group: group,
      uniformID: currentData['Has Uniform?'] ? 'Assigned' : null,
      firstName,
      lastName,
      groupId,
      hasUniform: currentData['Has Uniform?'] || false
    });
  } catch (error) {
    console.error('Error updating athlete:', error);
    res.status(500).json({ error: 'Failed to update athlete' });
  }
});

// Delete an athlete
router.delete('/:id', checkAuth, async (req, res) => {
  try {
    const athleteId = req.params.id;
    
    // Check if athlete exists
    const athleteRef = admin.firestore().collection('athletes').doc(athleteId);
    const doc = await athleteRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Athlete not found' });
    }
    
    // Delete the athlete
    await athleteRef.delete();
    
    res.status(200).json({ message: 'Athlete deleted successfully' });
  } catch (error) {
    console.error('Error deleting athlete:', error);
    res.status(500).json({ error: 'Failed to delete athlete' });
  }
});

// Helper function to convert group ID to name
function getGroupName(groupId) {
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
}

// Helper function to convert group name to ID
function getGroupId(groupName) {
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
}

module.exports = router; 