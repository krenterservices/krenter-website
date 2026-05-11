// Firebase Configuration
// Update these values with your Firebase project credentials from Firebase Console

export const firebaseConfig = {
  apiKey: 'AIzaSyDZHxQf0Vw19sG0GC92ptcXRFZrUUrEcqA',
  authDomain: 'krenterkapp.firebaseapp.com',
  projectId: 'krenterkapp',
  storageBucket: 'krenterkapp.firebasestorage.app',
  messagingSenderId: '580860264511',
  appId: '1:580860264511:web:8e78cc5ffe5e4c6fdf388a',
  measurementId: 'G-3VCBRMG08M',
};

/**
 * HOW TO GET YOUR FIREBASE CREDENTIALS:
 *
 * 1. Go to https://console.firebase.google.com
 * 2. Select or create your project
 * 3. Click on "Project Settings" (⚙️ icon)
 * 4. Go to "Your apps" section and click on your web app (or add a new web app)
 * 5. Copy the firebaseConfig object
 * 6. Replace the values above with your actual credentials
 *
 * FIRESTORE SETUP:
 * 1. In Firebase Console, go to "Firestore Database"
 * 2. Click "Create Database"
 * 3. Select "Start in production mode"
 * 4. Choose your location
 * 5. Update Firestore Rules to:
 *
 *    rules_version = '2';
 *    service cloud.firestore {
 *      match /databases/{database}/documents {
 *        match /users/{document=**} {
 *          allow read, write: if request.auth != null;
 *        }
 *        match /properties/{document=**} {
 *          allow read: if request.auth != null;
 *          allow create: if request.auth != null;
 *          allow update, delete: if request.auth.uid == resource.data.ownerId;
 *        }
 *        match /rentals/{document=**} {
 *          allow read: if request.auth != null;
 *          allow create: if request.auth != null;
 *          allow update, delete: if request.auth.uid == resource.data.ownerId || request.auth.uid == resource.data.renterId;
 *        }
 *      }
 *    }
 *
 * DATABASE COLLECTIONS TO CREATE MANUALLY:
 * 1. users collection - stores user profile data
 * 2. properties collection - stores property information
 * 3. rentals collection - stores rental transactions
 */
