const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Check if the users collection exists and if users have roles
async function checkUsers() {
  try {
    console.log('Checking users collection...');
    
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('No users found in the database!');
      return;
    }
    
    console.log(`Found ${usersSnapshot.size} users in the database.`);
    
    // Check each user for a role field
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      console.log(`User ID: ${doc.id}`);
      console.log(`  Email: ${userData.email || 'Not set'}`);
      console.log(`  Role: ${userData.role || 'NOT SET - This is a problem!'}`);
      console.log('-----------------------------------');
    });
    
    // Now check if athletes collection exists and has any documents
    console.log('\nChecking athletes collection...');
    const athletesSnapshot = await db.collection('athletes').get();
    
    if (athletesSnapshot.empty) {
      console.log('No athletes found in the database!');
    } else {
      console.log(`Found ${athletesSnapshot.size} athletes in the database.`);
    }
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    // Close the Firebase connection
    process.exit(0);
  }
}

// Run the check
checkUsers(); 