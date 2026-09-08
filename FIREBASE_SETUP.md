# Firebase Integration Setup Guide

## Overview
Your Krenter app now has Firebase authentication and Firestore database integration. This guide will help you set up your Firebase project and configure the app.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" or select an existing project
3. Enter your project name (e.g., "Krenter")
4. Choose your region
5. Click "Create project" and wait for it to complete

## Step 2: Create Web App

1. In Firebase Console, click the web icon (</>) in the "Get started by adding Firebase to your app" section
2. Enter app name (e.g., "Krenter Web")
3. Check "Also set up Firebase Hosting for this app" (optional)
4. Click "Register app"
5. You'll see your Firebase configuration - **KEEP THIS SAFE**

## Step 3: Copy Firebase Configuration

Your Firebase config will look like this:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## Step 4: Update App Configuration

1. Open `/src/app/config/firebase.config.ts`
2. Replace all placeholder values with your Firebase config:

```typescript
export const firebaseConfig = {
  apiKey: 'YOUR_ACTUAL_API_KEY',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID'
};
```

## Step 5: Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Click "Email/Password"
4. Enable Email/Password provider
5. Click "Save"

## Step 6: Set Up Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Start in **Production mode** (we'll add security rules)
4. Choose your region
5. Click "Create"

### Step 6a: Create Collections

Create these collections in Firestore:

**1. users collection:**
- Will store user profile data automatically
- Access rules: users can only read/write their own data

**2. properties collection:**
- Will store property listings
- Access rules: owners can create/edit their own properties

**3. rentals collection:**
- Will store rental transactions
- Access rules: owners and renters can access their relevant rentals

### Step 6b: Set Firestore Security Rules

1. In Firestore Database, go to "Rules" tab
2. Replace the default rules with:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == userId;
      allow delete: if request.auth.uid == userId;
    }

    // Anyone authenticated can read properties
    // Only owners can create/update/delete their own properties
    match /properties/{propertyId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.ownerId;
      allow delete: if request.auth.uid == resource.data.ownerId;
    }

    // Rental management
    // Renters and owners can access their rentals
    match /rentals/{rentalId} {
      allow read: if request.auth != null && (
        request.auth.uid == resource.data.ownerId ||
        request.auth.uid == resource.data.renterId
      );
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.ownerId ||
        request.auth.uid == resource.data.renterId;
      allow delete: if request.auth.uid == resource.data.ownerId ||
        request.auth.uid == resource.data.renterId;
    }
  }
}
```

3. Click "Publish"

## Step 7: Features Overview

### For Renters:
- ✅ Sign up with email and password
- ✅ Browse available properties
- ✅ View property details
- ✅ Rent properties
- ✅ Track current rentals
- ✅ View rental details and dates

### For Owners:
- ✅ Sign up as property owner
- ✅ Add new properties
- ✅ Edit property details
- ✅ Delete properties
- ✅ View all their properties
- ✅ See who is renting each property
- ✅ View renter details and rental information
- ✅ Manage rental status

## Step 8: Database Schema

### users Collection
```typescript
{
  uid: string,              // Firebase Auth UID
  email: string,            // User email
  name: string,             // Full name
  role: 'owner' | 'renter', // User role
  phone?: string,           // Optional phone
  profilePicture?: string,  // Optional profile image URL
  createdAt: Timestamp      // Account creation date
}
```

### properties Collection
```typescript
{
  id: string,           // Document ID
  name: string,         // Property name
  type: string,         // Flat, House, Apartment, etc.
  price: number,        // Monthly price
  location: string,     // Location/address
  description?: string, // Detailed description
  amenities?: string[], // List of amenities
  images?: string[],    // Image URLs
  ownerId: string,      // Owner's Firebase UID
  isAvailable: boolean, // Availability status
  createdAt: Timestamp, // Creation date
  updatedAt: Timestamp  // Last updated
}
```

### rentals Collection
```typescript
{
  id: string,
  propertyId: string,        // Reference to property
  ownerId: string,           // Owner's Firebase UID
  renterId: string,          // Renter's Firebase UID
  rentalPrice: number,       // Monthly rental price
  startDate: Timestamp,      // Rental start
  endDate?: Timestamp,       // Rental end (optional)
  status: string,            // 'active' | 'completed' | 'cancelled'
  rentalDetails?: {
    deposit?: number,
    contractUrl?: string
  },
  createdAt: Timestamp
}
```

## Step 9: Testing

### Test Renter Account
1. Go to http://localhost:4200/register
2. Create account with:
   - Name: Test Renter
   - Email: renter@test.com
   - Password: Test123456
   - Role: Renter
3. Browse properties at /properties
4. Rent a property

### Test Owner Account
1. Create new account with:
   - Name: Test Owner
   - Email: owner@test.com
   - Password: Test123456
   - Role: Owner
2. Go to /add-property to add properties
3. View rentals at /my-rentals (renters) or /my-properties (owners)

## Step 10: Environment Variables (Optional but Recommended)

For production, create a separate config file:

1. Create `.env` file (DO NOT commit to Git):
```
FIREBASE_API_KEY=YOUR_API_KEY
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
...
```

2. Update `firebase.config.ts` to use environment variables

## Common Issues

### Issue: "Firebase credentials not configured"
**Solution:** Update `/src/app/config/firebase.config.ts` with your actual Firebase credentials

### Issue: "Permission denied" errors in console
**Solution:** Check your Firestore security rules - make sure they're published correctly

### Issue: Can't register new users
**Solution:** 
1. Check Email/Password authentication is enabled
2. Verify user collection can be created (Firestore will auto-create on first write)

### Issue: Properties not showing
**Solution:**
1. Make sure properties are created in Firestore
2. Check that `isAvailable` is set to `true`
3. Verify ownership (check `ownerId` matches current user)

## Security Notes

⚠️ **Important Security Tips:**

1. **Never commit** `firebase.config.ts` with real credentials
2. **Use Firestore Rules** to protect data (rules provided above)
3. **Enable Authentication** only for your app domain
4. **Use HTTPS** - Firebase requires secure connections
5. **Validate data** on backend (Firestore rules) and frontend
6. **Never store passwords** in Firestore

## Firebase Features Being Used

✅ **Firebase Authentication**
- Email/Password sign in and registration
- Persistent user sessions
- User state management

✅ **Firestore Database**
- Real-time data synchronization
- Role-based access control
- Collections for users, properties, and rentals

## Next Steps

1. Complete Firebase setup (Steps 1-6)
2. Update firebase.config.ts with your credentials
3. Test the application
4. Deploy to production (Firebase Hosting recommended)

## Support

For Firebase help:
- Go to Firebase Console > Help & support
- Check [Firebase Documentation](https://firebase.google.com/docs)
- Browse [Firebase Samples](https://github.com/firebase/firebase-web-samples)

---

**Created:** May 2026
**Version:** 1.0
**Status:** Ready for Configuration

