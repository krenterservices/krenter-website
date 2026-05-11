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
      const ownersQuery = query(usersCollection, where('role', '==', 'owner'));
      const querySnapshot = await getDocs(ownersQuery);

      return querySnapshot.docs.map(doc => doc.data() as KrenterUser);
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
      const rentersQuery = query(usersCollection, where('role', '==', 'renter'));
      const querySnapshot = await getDocs(rentersQuery);

      return querySnapshot.docs.map(doc => doc.data() as KrenterUser);
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
