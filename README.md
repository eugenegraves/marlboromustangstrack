# Track Team Management Web Application

A comprehensive web application for managing a high school track team, featuring athlete profiles, performance tracking, meet schedules, and more.

## Technology Stack

- **Frontend**: React with Material-UI, GSAP animations, and Three.js for 3D effects
- **Backend**: Node.js with Express
- **Database**: Firebase Firestore
- **Storage**: Cloudinary (free tier)
- **Authentication**: Firebase Authentication

## Team Colors

- Navy Blue: #1C2526
- Yellow: #FFC107
- White: #FFFFFF

## Project Structure

```
track-team-app/
├── frontend/                # React frontend
│   ├── public/              # Public assets
│   └── src/
│       ├── assets/          # Images, logos, icons
│       ├── components/      # Reusable UI components
│       ├── pages/           # Page components
│       ├── services/        # API and service functions
│       ├── styles/          # Theme and global styles
│       ├── App.js           # Main application component
│       ├── firebase.js      # Firebase client configuration
│       └── index.js         # Application entry point
└── backend/                 # Node.js backend
    ├── api/                 # API routes
    ├── services/            # Backend services
    ├── .env                 # Environment variables
    ├── index.js             # Express server setup
    └── firebase-admin.js    # Firebase admin configuration
```

## Setup Instructions

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

### Firebase Setup

1. Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Firestore and Authentication services
3. Add a web app to your Firebase project
4. Copy the Firebase configuration to the frontend's `src/firebase.js` file
5. Generate a service account key for backend integration and save it to `backend/config/serviceAccountKey.json`

### Cloudinary Setup

1. Sign up for a free Cloudinary account at [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. From your Cloudinary dashboard, copy your Cloud name, API Key, and API Secret
3. Update the `.env` file in the backend directory with your Cloudinary credentials:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. The frontend is already configured to use the backend API for uploads

### Testing the Cloudinary Upload

1. Start both the backend and frontend servers
2. Navigate to the upload demo page at `/upload-demo`
3. Try uploading an image to test the Cloudinary integration

## Features (Planned)

- Athlete profiles and performance tracking
- Meet schedule and results management
- Training plans and workout tracking
- Team announcements and communication
- Photo and video galleries
- Admin dashboard for coaches 