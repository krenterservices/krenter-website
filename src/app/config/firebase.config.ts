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
 *        match /deletion_requests/{document=**} {
 *          // Public write so mobile app users who uninstalled can request deletion per Apple/Google Play policy
 *          allow create: if true;
 *          allow read, update, delete: if request.auth != null;
 *        }
 *        match /mail/{document=**} {
 *          // Writeable by system / client to trigger emails via Firebase Trigger Email extension
 *          allow create: if true;
 *          allow read, update, delete: if request.auth != null;
 *        }
 *        match /messages/{document=**} {
 *          allow read, write: if request.auth != null;
 *        }
 *        match /payments/{document=**} {
 *          allow read, write: if request.auth != null;
 *        }
 *      }
 *    }
 *
 * DATABASE COLLECTIONS:
 * 1. users - stores user profile data
 * 2. properties - stores property information
 * 3. rentals / renters - stores rental agreements and transactions
 * 4. deletion_requests - stores Google Play & App Store user deletion requests
 * 5. mail - queues email notifications (Trigger Email from Firestore extension)
 * 6. messages - stores user communications
 * 7. payments - stores payment and transaction records
 */
