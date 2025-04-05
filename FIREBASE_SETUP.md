# Firebase Setup Guide for Track Team Management System

## 1. Prerequisites

- Firebase account (create one at [firebase.google.com](https://firebase.google.com/) if you don't have one)
- Node.js and npm installed locally
- Firebase CLI tools (`npm install -g firebase-tools`)

## 2. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name your project (e.g., "Track Team Management System")
4. Configure Google Analytics (optional but recommended)
5. Click "Create project"

## 3. Setup Firebase Authentication

1. In the Firebase console, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Enable "Email/Password" authentication method
4. (Optional) Enable additional authentication methods as needed

## 4. Setup Firestore Database

1. In the Firebase console, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in production mode"
4. Select a location closest to your users
5. Click "Enable"

## 5. Deploy Firestore Security Rules

1. In the Firebase console, go to "Firestore Database" → "Rules" tab
2. Copy the contents of the `firestore.rules` file from this project
3. Paste the rules into the rules editor in the Firebase console
4. Click "Publish"

## 6. Create User Roles

After registering your first account (coach/admin):

1. Go to "Firestore Database" in the Firebase console
2. Navigate to the "users" collection
3. Find the document corresponding to your user (it should have the same ID as your Firebase Auth UID)
4. Add a field:
   - Field name: `role`
   - Field value: `coach` (or `admin` for administrator access)

## 7. Create Service Account for Backend

1. In the Firebase console, click the gear icon (⚙️) to access "Project settings"
2. Go to the "Service accounts" tab
3. Click "Generate new private key"
4. Save the downloaded JSON file as `serviceAccountKey.json` in your project's `backend/config/` directory
5. Make sure this file is in your `.gitignore` to keep it secure!

## 8. Update Backend Environment Configuration

1. In the backend directory, update the `.env` file with:
   ```
   PORT=5011
   NODE_ENV=development
   FIREBASE_PROJECT_ID=your-project-id
   ```

## 9. Install and Run Backend

1. Navigate to the backend directory
2. Install dependencies: `npm install`
3. Start the server: `npm run dev` or `node index.js`

## 10. Initialize Frontend with Firebase

1. Make sure your Firebase configuration in `frontend/src/firebase.js` matches the "Web configuration" values from your Firebase project settings

## 11. Test the Application

1. Start the frontend: `cd frontend && npm start`
2. Register a coach account
3. Set the user role as described in step 6
4. Log in and test the athlete management functionality

## Security Notes

- Never commit `serviceAccountKey.json` to version control
- Regularly review your Firebase security rules
- For production, update CORS settings in the backend to limit requests to specific origins 