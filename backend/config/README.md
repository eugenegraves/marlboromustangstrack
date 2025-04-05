# Firebase Service Account Configuration

## Required File: `serviceAccountKey.json`

You need to place your Firebase service account key file in this directory named `serviceAccountKey.json`.

## How to obtain the Service Account Key:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on the gear icon (⚙️) next to "Project Overview" to open Project settings
4. Go to the "Service accounts" tab
5. Click "Generate new private key" button
6. Save the downloaded JSON file as `serviceAccountKey.json` in this directory

## Security Notice:

⚠️ **IMPORTANT**: Never commit this file to version control!

Make sure the file is properly added to .gitignore to prevent accidentally exposing your credentials.

## What this file is used for:

This service account key allows your backend server to authenticate with Firebase Admin SDK and interact with Firestore, Authentication, and other Firebase services with admin privileges. 