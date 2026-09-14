import { Injectable } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { KrenterUser } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private firestore: Firestore) { }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<KrenterUser | null> {
    try {
      const userDocRef = doc(this.firestore, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        return userDoc.data() as KrenterUser;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, userData: Partial<KrenterUser>): Promise<boolean> {
    try {
      const userDocRef = doc(this.firestore, 'users', userId);
      await updateDoc(userDocRef, userData);
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  /**
   * Get all owners
   */
  async getOwners(): Promise<KrenterUser[]> {
    try {
      const usersCollection = collection(this.firestore, 'users');
      const userMap = new Map<string, KrenterUser>();

      const arrayQuery = query(usersCollection, where('roles', 'array-contains', 'owner'));
      const arraySnapshot = await getDocs(arrayQuery);
      arraySnapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        userMap.set(docSnap.id, { ...data, id: docSnap.id, uid: data['uid'] || docSnap.id } as KrenterUser);
      });

      const legacyOwnerQuery = query(usersCollection, where('role', '==', 'owner'));
      const legacySnapshot = await getDocs(legacyOwnerQuery);
      legacySnapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        userMap.set(docSnap.id, { ...data, id: docSnap.id, uid: data['uid'] || docSnap.id } as KrenterUser);
      });

      const legacyBothQuery = query(usersCollection, where('role', '==', 'both'));
      const bothSnapshot = await getDocs(legacyBothQuery);
      bothSnapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        userMap.set(docSnap.id, { ...data, id: docSnap.id, uid: data['uid'] || docSnap.id } as KrenterUser);
      });

      return Array.from(userMap.values());
    } catch (error) {
      console.error('Error fetching owners:', error);
      return [];
    }
  }

  /**
   * Get all renters
   */
  async getRenters(): Promise<KrenterUser[]> {
    try {
      const usersCollection = collection(this.firestore, 'users');
      const userMap = new Map<string, KrenterUser>();

      const arrayQuery = query(usersCollection, where('roles', 'array-contains', 'renter'));
      const arraySnapshot = await getDocs(arrayQuery);
      arraySnapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        userMap.set(docSnap.id, { ...data, id: docSnap.id, uid: data['uid'] || docSnap.id } as KrenterUser);
      });

      const legacyRenterQuery = query(usersCollection, where('role', '==', 'renter'));
      const legacySnapshot = await getDocs(legacyRenterQuery);
      legacySnapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        userMap.set(docSnap.id, { ...data, id: docSnap.id, uid: data['uid'] || docSnap.id } as KrenterUser);
      });

      const legacyBothQuery = query(usersCollection, where('role', '==', 'both'));
      const bothSnapshot = await getDocs(legacyBothQuery);
      bothSnapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        userMap.set(docSnap.id, { ...data, id: docSnap.id, uid: data['uid'] || docSnap.id } as KrenterUser);
      });

      return Array.from(userMap.values());
    } catch (error) {
      console.error('Error fetching renters:', error);
      return [];
    }
  }

  /**
   * Get renter details by ID
   */
  async getRenterDetails(renterId: string): Promise<KrenterUser | null> {
    return this.getUserById(renterId);
  }
}
