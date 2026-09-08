import { Injectable } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc
} from '@angular/fire/firestore';
import { Observable, BehaviorSubject } from 'rxjs';

export interface Property {
  id?: string;
  name: string;
  type: string; // Flat, House, Apartment, etc.
  price: number;
  location: string;
  description?: string;
  amenities?: string[];
  images?: string[];
  ownerId: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Rental {
  id?: string;
  propertyId: string;
  ownerId: string;
  renterId: string;
  rentalPrice: number;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  rentalDetails?: {
    deposit?: number;
    contractUrl?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private propertiesSubject = new BehaviorSubject<Property[]>([]);
  public properties$ = this.propertiesSubject.asObservable();

  constructor(private firestore: Firestore) { }

  /**
   * Get all available properties
   */
  async getProperties(): Promise<Property[]> {
    try {
      const propertiesCollection = collection(this.firestore, 'properties');
      const availableQuery = query(propertiesCollection, where('isAvailable', '==', true));
      const querySnapshot = await getDocs(availableQuery);

      const properties = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Property
      }));

      return properties;
    } catch (error) {
      console.error('Error fetching properties:', error);
      return [];
    }
  }

  /**
   * Get single property by ID
   */
  async getProperty(propertyId: string): Promise<Property | null> {
    try {
      const propertyDoc = await getDoc(doc(this.firestore, 'properties', propertyId));

      if (propertyDoc.exists()) {
        return {
          id: propertyDoc.id,
          ...propertyDoc.data() as Property
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching property:', error);
      return null;
    }
  }

  /**
   * Create new property (Owner only)
   */
  async addProperty(property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      const propertiesCollection = collection(this.firestore, 'properties');
      const docRef = await addDoc(propertiesCollection, {
        ...property,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding property:', error);
      return null;
    }
  }

  /**
   * Update property (Owner only)
   */
  async updateProperty(propertyId: string, updates: Partial<Property>): Promise<boolean> {
    try {
      const propertyDoc = doc(this.firestore, 'properties', propertyId);
      await updateDoc(propertyDoc, {
        ...updates,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error updating property:', error);
      return false;
    }
  }

  /**
   * Delete property (Owner only)
   */
  async deleteProperty(propertyId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(this.firestore, 'properties', propertyId));
      return true;
    } catch (error) {
      console.error('Error deleting property:', error);
      return false;
    }
  }

  /**
   * Get properties by owner
   */
  async getPropertiesByOwner(ownerId: string): Promise<Property[]> {
    try {
      const propertiesCollection = collection(this.firestore, 'properties');
      const ownerQuery = query(propertiesCollection, where('ownerId', '==', ownerId));
      const querySnapshot = await getDocs(ownerQuery);

      const properties = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Property
      }));

      return properties;
    } catch (error) {
      console.error('Error fetching owner properties:', error);
      return [];
    }
  }

  /**
   * Create rental transaction
   */
  async rentProperty(rental: Omit<Rental, 'id' | 'createdAt'>): Promise<string | null> {
    try {
      // Create rental document
      const rentalsCollection = collection(this.firestore, 'rentals');
      const rentalDocRef = await addDoc(rentalsCollection, {
        ...rental,
        createdAt: new Date()
      });

      // Update property availability
      await this.updateProperty(rental.propertyId, { isAvailable: false });

      return rentalDocRef.id;
    } catch (error) {
      console.error('Error creating rental:', error);
      return null;
    }
  }

  /**
   * Get rentals by user (as owner)
   */
  async getRentalsByOwner(ownerId: string): Promise<Rental[]> {
    try {
      const rentalsCollection = collection(this.firestore, 'rentals');
      const ownerQuery = query(rentalsCollection, where('ownerId', '==', ownerId));
      const querySnapshot = await getDocs(ownerQuery);

      const rentals = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Rental
      }));

      return rentals;
    } catch (error) {
      console.error('Error fetching owner rentals:', error);
      return [];
    }
  }

  /**
   * Get rentals by renter
   */
  async getRentalsByRenter(renterId: string): Promise<Rental[]> {
    try {
      const rentalsCollection = collection(this.firestore, 'rentals');
      const renterQuery = query(rentalsCollection, where('renterId', '==', renterId));
      const querySnapshot = await getDocs(renterQuery);

      const rentals = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Rental
      }));

      return rentals;
    } catch (error) {
      console.error('Error fetching renter rentals:', error);
      return [];
    }
  }

  /**
   * Get single rental details
   */
  async getRental(rentalId: string): Promise<Rental | null> {
    try {
      const rentalDoc = await getDoc(doc(this.firestore, 'rentals', rentalId));

      if (rentalDoc.exists()) {
        return {
          id: rentalDoc.id,
          ...rentalDoc.data() as Rental
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching rental:', error);
      return null;
    }
  }

  /**
   * Update rental status
   */
  async updateRental(rentalId: string, updates: Partial<Rental>): Promise<boolean> {
    try {
      const rentalDoc = doc(this.firestore, 'rentals', rentalId);
      await updateDoc(rentalDoc, updates);
      return true;
    } catch (error) {
      console.error('Error updating rental:', error);
      return false;
    }
  }

  /**
   * Get renters for a specific property
   */
  async getRentersForProperty(propertyId: string): Promise<Rental[]> {
    try {
      const rentalsCollection = collection(this.firestore, 'rentals');
      const propertyQuery = query(
        rentalsCollection,
        where('propertyId', '==', propertyId),
        where('status', '==', 'active')
      );
      const querySnapshot = await getDocs(propertyQuery);

      const rentals = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Rental
      }));

      return rentals;
    } catch (error) {
      console.error('Error fetching property renters:', error);
      return [];
    }
  }

  /**
   * Get all rentals (admin view)
   */
  async getAllRentals(): Promise<Rental[]> {
    try {
      const rentalsCollection = collection(this.firestore, 'rentals');
      const querySnapshot = await getDocs(rentalsCollection);

      const rentals = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Rental
      }));

      return rentals;
    } catch (error) {
      console.error('Error fetching all rentals:', error);
      return [];
    }
  }
}
