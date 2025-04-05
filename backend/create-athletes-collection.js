const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Sample athlete data
const sampleAthletes = [
  {
    name: "John Smith",
    group: "Elite Sprinters",
    uniformID: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    name: "Sarah Johnson",
    group: "Beginner Distance",
    uniformID: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    name: "Michael Chen",
    group: "Intermediate Throwers",
    uniformID: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }
];

// Create the athletes collection with sample data
async function createAthletesCollection() {
  try {
    console.log('Creating athletes collection with sample data...');
    
    // Check if collection exists and has documents
    const snapshot = await db.collection('athletes').get();
    
    if (!snapshot.empty) {
      console.log(`Athletes collection already exists with ${snapshot.size} documents. Skipping creation.`);
      return;
    }
    
    // Create batch to add sample athletes
    const batch = db.batch();
    
    sampleAthletes.forEach(athlete => {
      const docRef = db.collection('athletes').doc();
      batch.set(docRef, athlete);
    });
    
    await batch.commit();
    
    console.log(`Successfully added ${sampleAthletes.length} sample athletes to Firestore!`);
    
  } catch (error) {
    console.error('Error creating athletes collection:', error);
  } finally {
    // Close the Firebase connection
    process.exit(0);
  }
}

// Run the script
createAthletesCollection(); 