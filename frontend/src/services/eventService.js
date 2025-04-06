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
  where,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';

// API base URL - should be environment variable in production
const API_BASE_URL = 'http://localhost:5011/api';

/**
 * Get all events from Firestore, optionally filtered by group
 */
export const getEvents = async (filterGroup = 'All') => {
  try {
    console.log('Fetching events with filter group:', filterGroup);
    
    // Get events from Firestore
    const eventsCollection = collection(db, 'events');
    let q = query(eventsCollection, orderBy('date'));
    
    // Filter by group if not "All"
    if (filterGroup !== 'All') {
      // We need to get events where the group array contains the filter group
      q = query(eventsCollection, 
        where('group', 'array-contains', filterGroup),
        orderBy('date')
      );
    }
    
    const eventSnapshot = await getDocs(q);
    
    // Transform the documents into a more usable format
    const events = eventSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore Timestamps to JavaScript Dates for easier handling
      date: doc.data().date instanceof Timestamp 
        ? doc.data().date.toDate() 
        : new Date(doc.data().date)
    }));
    
    console.log(`Retrieved ${events.length} events`);
    return events;
  } catch (error) {
    console.error('Error getting events:', error);
    throw new Error('Failed to fetch events. Please try again later.');
  }
};

/**
 * Create a new event in Firestore
 */
export const createEvent = async (eventData) => {
  try {
    const { title, date, group, type } = eventData;
    
    // Validate required fields
    if (!title || !date || !group || !type) {
      throw new Error('Title, date, group, and type are required fields');
    }
    
    // Validate that group is an array
    const groupArray = Array.isArray(group) ? group : [group];
    if (groupArray.length === 0) {
      throw new Error('At least one group must be selected');
    }
    
    // Create a copy of eventData with the group as an array
    const processedEventData = {
      ...eventData,
      group: groupArray
    };
    
    console.log('Creating event with data:', JSON.stringify(processedEventData, null, 2));
    
    // First try to directly create in Firestore
    try {
      // Add to Firestore directly as a fallback
      const eventsCollection = collection(db, 'events');
      const eventDataWithTimestamps = {
        ...processedEventData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(eventsCollection, eventDataWithTimestamps);
      console.log('Event created with ID:', docRef.id);
      
      return {
        id: docRef.id,
        ...eventDataWithTimestamps
      };
    } catch (firestoreError) {
      console.error('Direct Firestore error:', firestoreError);
      
      // Get the current user token for authentication and try the API approach
      console.log('Attempting to use backend API for event creation...');
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('You must be logged in to create events. No user found.');
      }
      
      const token = await currentUser.getIdToken();
      
      // Create the event using the backend API
      const response = await axios.post(`${API_BASE_URL}/events`, processedEventData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Event created via API:', response.data);
      return response.data;
    }
  } catch (error) {
    console.error('Error creating event:', error);
    if (error.response) {
      console.error('API Response Error:', error.response.data);
      console.error('Status:', error.response.status);
    }
    
    throw new Error(
      error.response?.data?.error || 
      error.response?.data?.details || 
      error.message || 
      'Failed to create event - please ensure you have permission and are logged in'
    );
  }
};

/**
 * Update an existing event in Firestore
 */
export const updateEvent = async (id, eventData) => {
  try {
    const { title, date, group, type } = eventData;
    
    // Validate required fields
    if (!title || !date || !group || !type) {
      throw new Error('Title, date, group, and type are required fields');
    }
    
    // Validate that group is an array
    const groupArray = Array.isArray(group) ? group : [group];
    if (groupArray.length === 0) {
      throw new Error('At least one group must be selected');
    }
    
    // Create a copy of eventData with the group as an array
    const processedEventData = {
      ...eventData,
      group: groupArray
    };
    
    try {
      // Update directly in Firestore
      const docRef = doc(db, 'events', id);
      const eventDataWithTimestamp = {
        ...processedEventData,
        updatedAt: new Date()
      };
      
      await updateDoc(docRef, eventDataWithTimestamp);
      console.log('Event updated with ID:', id);
      
      return {
        id,
        ...eventDataWithTimestamp
      };
    } catch (firestoreError) {
      console.error('Direct Firestore update error:', firestoreError);
      
      // Fallback to API
      // Get the current user token for authentication
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('You must be logged in to update events. No user found.');
      }
      
      const token = await currentUser.getIdToken();
      
      // Update the event using the backend API
      const response = await axios.put(`${API_BASE_URL}/events/${id}`, processedEventData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Event updated via API:', response.data);
      return response.data;
    }
  } catch (error) {
    console.error(`Error updating event with ID ${id}:`, error);
    if (error.response) {
      console.error('API Response Error:', error.response.data);
      console.error('Status:', error.response.status);
    }
    
    throw new Error(
      error.response?.data?.error || 
      error.response?.data?.details || 
      error.message || 
      'Failed to update event - please ensure you have permission and are logged in'
    );
  }
};

/**
 * Delete an event from Firestore
 */
export const deleteEvent = async (id) => {
  try {
    // Get the current user token for authentication
    const token = await auth.currentUser.getIdToken();
    
    // Delete the event using the backend API
    await axios.delete(`${API_BASE_URL}/events/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error(`Error deleting event with ID ${id}:`, error);
    throw error.response?.data || error;
  }
};

/**
 * Get unique groups from athletes collection for dropdown
 */
export const getAthleteGroups = async () => {
  try {
    // First import the group mapping from athleteService
    const groups = [
      'Elite Sprinters',
      'Intermediate Sprinters',
      'Beginner Sprinters',
      'Elite Distance',
      'Intermediate Distance',
      'Beginner Distance',
      'Elite Throwers',
      'Intermediate Throwers',
      'Beginner Throwers',
      'Elite Jumpers',
      'Intermediate Jumpers',
      'Beginner Jumpers'
    ];
    
    // Create array with "All" at the beginning plus all the groups
    const allGroups = ['All', ...groups];
    
    console.log("Available groups for events:", allGroups);
    
    return allGroups;
  } catch (error) {
    console.error('Error getting athlete groups:', error);
    return ['All']; // Return at least the "All" option as a fallback
  }
}; 