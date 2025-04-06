const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const checkAuth = require('../middleware/auth');

// Reference to Firestore
const db = admin.firestore();
const eventsCollection = db.collection('events');

/**
 * GET all events
 * Access: Coaches only
 */
router.get('/', checkAuth, async (req, res) => {
  try {
    const snapshot = await eventsCollection.get();
    const events = [];
    
    snapshot.forEach(doc => {
      events.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ 
      error: 'Failed to fetch events',
      details: error.message 
    });
  }
});

/**
 * GET a single event by ID
 * Access: Coaches only
 */
router.get('/:id', checkAuth, async (req, res) => {
  try {
    const eventDoc = await eventsCollection.doc(req.params.id).get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.status(200).json({
      id: eventDoc.id,
      ...eventDoc.data()
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ 
      error: 'Failed to fetch event',
      details: error.message 
    });
  }
});

/**
 * POST a new event
 * Access: Coaches only
 */
router.post('/', checkAuth, async (req, res) => {
  try {
    const { title, date, group, type } = req.body;
    
    // Validate required fields
    if (!title || !date || !group || !type) {
      return res.status(400).json({ error: 'Title, date, group, and type are required fields' });
    }
    
    // Validate type
    if (type !== 'Practice' && type !== 'Meet') {
      return res.status(400).json({ error: 'Type must be either "Practice" or "Meet"' });
    }
    
    // Create the event
    const eventData = {
      title,
      date,
      group,
      type,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await eventsCollection.add(eventData);
    
    res.status(201).json({
      id: docRef.id,
      ...eventData
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ 
      error: 'Failed to create event',
      details: error.message 
    });
  }
});

/**
 * PUT (update) an existing event
 * Access: Coaches only
 */
router.put('/:id', checkAuth, async (req, res) => {
  try {
    const { title, date, group, type } = req.body;
    
    // Validate required fields
    if (!title || !date || !group || !type) {
      return res.status(400).json({ error: 'Title, date, group, and type are required fields' });
    }
    
    // Validate type
    if (type !== 'Practice' && type !== 'Meet') {
      return res.status(400).json({ error: 'Type must be either "Practice" or "Meet"' });
    }
    
    // Check if event exists
    const eventDoc = await eventsCollection.doc(req.params.id).get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Update the event
    const eventData = {
      title,
      date,
      group,
      type,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await eventsCollection.doc(req.params.id).update(eventData);
    
    res.status(200).json({
      id: req.params.id,
      ...eventData
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ 
      error: 'Failed to update event',
      details: error.message 
    });
  }
});

/**
 * DELETE an event
 * Access: Coaches only
 */
router.delete('/:id', checkAuth, async (req, res) => {
  try {
    // Check if event exists
    const eventDoc = await eventsCollection.doc(req.params.id).get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Delete the event
    await eventsCollection.doc(req.params.id).delete();
    
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ 
      error: 'Failed to delete event',
      details: error.message 
    });
  }
});

module.exports = router; 