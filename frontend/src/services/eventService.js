import axios from 'axios';
import { auth } from '../firebase';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

// API base URL - should be environment variable in production
const API_BASE_URL = 'http://localhost:5011/api';

/**
 * Get all events from Firestore, optionally filtered by group
 */
export const getEvents = async (filterGroup = 'All') => {
  try {
    // Log the correct expected group names for comparison
    console.log('⚠️ CORRECT EVENT GROUP NAMES:', [
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
    ]);
    
    console.log('Fetching events with filter group:', filterGroup);
    
    // CRITICAL FIX: First try getting all events without filtering to see what's actually stored
    const eventsCollection = collection(db, 'events');
    const allEventsQuery = query(eventsCollection, orderBy('date'));
    
    console.log('Executing Firestore query for ALL events to debug...');
    const allEventsSnapshot = await getDocs(allEventsQuery);
    console.log(`Retrieved ${allEventsSnapshot.docs.length} total events in the database`);
    
    // Analyze the first event to see its exact group structure
    if (allEventsSnapshot.docs.length > 0) {
      const firstEventData = allEventsSnapshot.docs[0].data();
      console.log('First event in database:', {
        id: allEventsSnapshot.docs[0].id,
        ...firstEventData,
        groupType: typeof firstEventData.group,
        groupIsArray: Array.isArray(firstEventData.group),
        groupValues: firstEventData.group
      });
    }
    
    // Now execute the filtered query
    let q;
    let filteredSnapshot;
    
    // Filter by group if not "All"
    if (filterGroup !== 'All') {
      try {
        console.log(`Attempting to filter by group: "${filterGroup}"`);
        
        // Try using the exact group string first (without conversion)
        q = query(eventsCollection, 
          where('group', 'array-contains', filterGroup),
          orderBy('date')
        );
        
        filteredSnapshot = await getDocs(q);
        console.log(`Query with direct string value returned ${filteredSnapshot.docs.length} documents`);
        
        // If first approach yielded no results, try again with different approaches
        if (filteredSnapshot.docs.length === 0) {
          // The stored values might be numeric indices (0, 1, 2) or other formats
          // Try to convert based on the actual mapping in your database
          const groupNameToValue = {
            'Elite Sprinters': 0, 
            'Intermediate Sprinters': 1,
            'Beginner Sprinters': 2,
            'Elite Distance': 3,
            'Intermediate Distance': 4,
            'Beginner Distance': 5,
            'Elite Throwers': 6,
            'Intermediate Throwers': 7,
            'Beginner Throwers': 8,
            'Elite Jumpers': 9,
            'Intermediate Jumpers': 10,
            'Beginner Jumpers': 11
          };
          
          const numericValue = groupNameToValue[filterGroup];
          console.log(`Trying with numeric value: ${numericValue} for group "${filterGroup}"`);
          
          q = query(eventsCollection, 
            where('group', 'array-contains', numericValue),
            orderBy('date')
          );
          
          filteredSnapshot = await getDocs(q);
          console.log(`Query with numeric value returned ${filteredSnapshot.docs.length} documents`);
        }
      } catch (filterError) {
        console.error('Error setting up group filter:', filterError);
        // Fallback to all events
        q = query(eventsCollection, orderBy('date'));
        filteredSnapshot = await getDocs(q);
      }
    } else {
      q = query(eventsCollection, orderBy('date'));
      filteredSnapshot = await getDocs(q);
    }
    
    // Use the appropriate snapshot based on our queries
    const eventSnapshot = filteredSnapshot || allEventsSnapshot;
    console.log(`Final query returned ${eventSnapshot.docs.length} documents`);
    
    // Transform the documents into a more usable format
    const events = eventSnapshot.docs.map(doc => {
      const data = doc.data();
      const id = doc.id;
      
      // Debug the exact structure of this particular event
      console.log(`Event ${id} raw data:`, {
        title: data.title,
        group: data.group,
        groupType: typeof data.group,
        isArray: Array.isArray(data.group),
        date: data.date
      });
      
      // Add display groups for UI
      if (data.group) {
        if (Array.isArray(data.group)) {
          // Map group values to display names
          const groupValueToName = {
            0: 'Elite Sprinters',
            1: 'Intermediate Sprinters',
            2: 'Beginner Sprinters',
            3: 'Elite Distance', 
            4: 'Intermediate Distance',
            5: 'Beginner Distance',
            6: 'Elite Throwers',
            7: 'Intermediate Throwers',
            8: 'Beginner Throwers',
            9: 'Elite Jumpers',
            10: 'Intermediate Jumpers',
            11: 'Beginner Jumpers'
          };
          
          data.displayGroups = data.group.map(g => {
            if (typeof g === 'number' || (typeof g === 'string' && !isNaN(parseInt(g)))) {
              const value = typeof g === 'number' ? g : parseInt(g);
              return groupValueToName[value] || `Group ${value}`;
            }
            return g; // Use as-is if it's already a string name
          });
        } else if (typeof data.group === 'number') {
          data.group = [data.group]; // Convert single number to array
        } else if (typeof data.group === 'string') {
          data.group = [data.group]; // Convert single string to array
        }
      } else {
        console.warn(`Event ${id} has no group field`);
        data.group = []; // Default to empty array
      }
      
      // Safely handle the date conversion
      let eventDate;
      try {
        if (data.date instanceof Timestamp) {
          eventDate = data.date.toDate();
        } else if (data.date && typeof data.date === 'object' && data.date.seconds) {
          // Handle Firestore timestamp object format
          eventDate = new Date(data.date.seconds * 1000);
        } else if (data.date) {
          // Handle string or number date
          eventDate = new Date(data.date);
        } else {
          // Fallback for missing date
          console.warn(`Event ${id} has no date, using current date`);
          eventDate = new Date();
        }
        
        console.log(`Converted date for event ${id}:`, eventDate);
      } catch (error) {
        console.error(`Error converting date for event ${id}:`, error);
        eventDate = new Date(); // Fallback to current date
      }
      
      return {
        id,
        ...data,
        date: eventDate
      };
    });
    
    console.log(`Final processed events for group "${filterGroup}":`, events);
    return events;
  } catch (error) {
    console.error('Error getting events:', error);
    throw new Error(`Failed to fetch events for group "${filterGroup}". ${error.message}`);
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
    
    // Convert string group names to numeric indices
    const groupNameToIndex = {
      'Elite Sprinters': 0,
      'Intermediate Sprinters': 1,
      'Beginner Sprinters': 2,
      'Elite Distance': 3,
      'Intermediate Distance': 4,
      'Beginner Distance': 5,
      'Elite Throwers': 6,
      'Intermediate Throwers': 7,
      'Beginner Throwers': 8,
      'Elite Jumpers': 9,
      'Intermediate Jumpers': 10,
      'Beginner Jumpers': 11
    };
    
    // Convert groups to array of numeric indices
    let groupArray;
    if (Array.isArray(group)) {
      groupArray = group.map(g => {
        const index = groupNameToIndex[g];
        if (index === undefined) {
          console.warn(`Group "${g}" not found in mapping, using as-is`);
          return g;
        }
        return index;
      });
    } else {
      const index = groupNameToIndex[group];
      groupArray = [index !== undefined ? index : group];
    }
    
    if (groupArray.length === 0) {
      throw new Error('At least one group must be selected');
    }
    
    // Create a copy of eventData with the group as an array of indices
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
    
    // Convert string group names to numeric indices
    const groupNameToIndex = {
      'Elite Sprinters': 0,
      'Intermediate Sprinters': 1,
      'Beginner Sprinters': 2,
      'Elite Distance': 3,
      'Intermediate Distance': 4,
      'Beginner Distance': 5,
      'Elite Throwers': 6,
      'Intermediate Throwers': 7,
      'Beginner Throwers': 8,
      'Elite Jumpers': 9,
      'Intermediate Jumpers': 10,
      'Beginner Jumpers': 11
    };
    
    // Convert groups to array of numeric indices
    let groupArray;
    if (Array.isArray(group)) {
      groupArray = group.map(g => {
        const index = groupNameToIndex[g];
        if (index === undefined) {
          console.warn(`Group "${g}" not found in mapping, using as-is`);
          return g;
        }
        return index;
      });
    } else {
      const index = groupNameToIndex[group];
      groupArray = [index !== undefined ? index : group];
    }
    
    if (groupArray.length === 0) {
      throw new Error('At least one group must be selected');
    }
    
    // Create a copy of eventData with the group as an array of indices
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
    // Delete the event directly from Firestore
    const eventRef = doc(db, 'events', id);
    await deleteDoc(eventRef);
  } catch (error) {
    console.error(`Error deleting event with ID ${id}:`, error);
    throw error;
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