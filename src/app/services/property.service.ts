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
  ownerEmailId?: string;
  ownerPhoneNumber?: string;
  renterEmailId?: string;
  renterPhoneNumber?: string;
  propertyManagerEmailId?: string;
  propertyManagerPhoneNumber?: string;

  name: string;
  society?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;

  bedrooms?: string;
  bathrooms?: string;
  floorNumber?: string;
  parking?: string;
  balcony?: string;
  description?: string;
  photoUrl?: string;

  createdAt?: Date;
  updatedAt?: Date;

  // Compatibility / website helper fields
  price?: number;
  type?: string;
  location?: string;
  ownerId?: string;
  isAvailable?: boolean;
  amenities?: string[];
  images?: string[];
}

export interface Renter {
  id?: string;
  ownerEmailId: string;
  propertyId: string;
  renterEmailId: string;
  ownerPhoneNumber?: string;
  renterPhoneNumber?: string;

  firstName?: string;
  lastName?: string;
  fatherName?: string;
  renterDateOfBirth?: string;
  renterPhotoIdType?: string;
  renterPhotoIdDocUrl?: string;
  renterStatus?: string; // active, old, inactive, pending, deactivated
  currencyCode?: string;
  securityDeposit?: string;
  paymentFrequency?: string;
  rentAmount?: number;

  idProofType?: string;
  idProofDocUrl?: string;
  photoUrl?: string;

  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  startDate?: Date;
  endDate?: Date;
  createdAt?: Date;

  // Compatibility fields
  renterId?: string;
  ownerId?: string;
  rentalPrice?: number;
  status?: 'active' | 'completed' | 'cancelled';
  rentalDetails?: {
    deposit?: number;
    contractUrl?: string;
  };
}

export type Rental = Renter;

function parseDate(val: any): Date | undefined {
  if (!val) return undefined;
  if (val.toDate && typeof val.toDate === 'function') return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === 'string') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

function mapDocToProperty(docSnap: any): Property {
  const data = docSnap.data();
  const addressParts = [data.address, data.city, data.state].filter(Boolean);
  const location = data.location || (addressParts.length > 0 ? addressParts.join(', ') : '');
  const isAvailable = data.isAvailable !== undefined
    ? data.isAvailable
    : (!data.renterEmailId && !data.renterPhoneNumber);

  return {
    id: docSnap.id,
    ...data,
    name: data.name || data.society || 'Property',
    location,
    type: data.type || (data.bedrooms ? `${data.bedrooms} Bed` : 'Rental'),
    price: data.price !== undefined ? data.price : (data.rentAmount !== undefined ? Number(data.rentAmount) : 0),
    isAvailable,
    createdAt: parseDate(data.createdAt) || new Date(),
    updatedAt: parseDate(data.updatedAt)
  };
}

function mapDocToRenter(docSnap: any): Renter {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    rentAmount: data.rentAmount !== undefined ? Number(data.rentAmount) : (data.rentalPrice || 0),
    rentalPrice: data.rentalPrice !== undefined ? Number(data.rentalPrice) : (data.rentAmount ? Number(data.rentAmount) : 0),
    status: data.status || data.renterStatus || 'active',
    renterStatus: data.renterStatus || data.status || 'active',
    startDate: parseDate(data.startDate) || new Date(),
    endDate: parseDate(data.endDate),
    createdAt: parseDate(data.createdAt) || new Date()
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
      const querySnapshot = await getDocs(propertiesCollection);

      const properties = querySnapshot.docs.map(docSnap => mapDocToProperty(docSnap));
      // Filter available properties
      return properties.filter(p => p.isAvailable === true || (!p.renterEmailId && !p.renterPhoneNumber && p.isAvailable !== false));
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
        return mapDocToProperty(propertyDoc);
      }
      return null;
    } catch (error) {
      console.error('Error fetching property:', error);
      return null;
    }
  }

  /**
   * Get user type for a property (mirroring UserTypeService in Flutter)
   */
  getUserTypeForProperty(property: Property, userEmail: string, userPhone?: string): 'owner' | 'renter' | 'propertyManager' | null {
    if (!userEmail && !userPhone) return null;
    if ((property.ownerEmailId && property.ownerEmailId.toLowerCase() === userEmail.toLowerCase()) ||
        (userPhone && property.ownerPhoneNumber === userPhone)) {
      return 'owner';
    }
    if ((property.renterEmailId && property.renterEmailId.toLowerCase() === userEmail.toLowerCase()) ||
        (userPhone && property.renterPhoneNumber === userPhone)) {
      return 'renter';
    }
    if ((property.propertyManagerEmailId && property.propertyManagerEmailId.toLowerCase() === userEmail.toLowerCase()) ||
        (userPhone && property.propertyManagerPhoneNumber === userPhone)) {
      return 'propertyManager';
    }
    return null;
  }

  /**
   * Check whether a user can access a specific property
   */
  canUserAccessProperty(property: Property, user: { email?: string; phone?: string; uid?: string } | null): boolean {
    if (property.isAvailable) return true;
    if (!user) return false;
    if (user.uid && property.ownerId === user.uid) return true;
    if (user.email) {
      if (property.ownerEmailId?.toLowerCase() === user.email.toLowerCase()) return true;
      if (property.renterEmailId?.toLowerCase() === user.email.toLowerCase()) return true;
      if (property.propertyManagerEmailId?.toLowerCase() === user.email.toLowerCase()) return true;
    }
    if (user.phone) {
      if (property.ownerPhoneNumber === user.phone) return true;
      if (property.renterPhoneNumber === user.phone) return true;
      if (property.propertyManagerPhoneNumber === user.phone) return true;
    }
    return false;
  }

  /**
   * Create new property
   */
  async addProperty(property: Partial<Property>): Promise<string | null> {
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
   * Get properties by owner email or ownerId
   */
  async getPropertiesByOwnerEmail(ownerEmail: string): Promise<Property[]> {
    try {
      const propertiesCollection = collection(this.firestore, 'properties');
      const q = query(propertiesCollection, where('ownerEmailId', '==', ownerEmail));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(docSnap => mapDocToProperty(docSnap));
    } catch (error) {
      console.error('Error fetching properties by owner email:', error);
      return [];
    }
  }

  /**
   * Get properties where user is assigned as renter (by email or phone)
   */
  async getPropertiesByRenterEmail(renterEmail: string, renterPhone?: string): Promise<Property[]> {
    try {
      const propertiesCollection = collection(this.firestore, 'properties');
      const resultMap = new Map<string, Property>();

      if (renterEmail) {
        const emailQuery = query(propertiesCollection, where('renterEmailId', '==', renterEmail));
        const emailSnapshot = await getDocs(emailQuery);
        emailSnapshot.docs.forEach(docSnap => {
          resultMap.set(docSnap.id, mapDocToProperty(docSnap));
        });
      }

      if (renterPhone) {
        const phoneQuery = query(propertiesCollection, where('renterPhoneNumber', '==', renterPhone));
        const phoneSnapshot = await getDocs(phoneQuery);
        phoneSnapshot.docs.forEach(docSnap => {
          resultMap.set(docSnap.id, mapDocToProperty(docSnap));
        });
      }

      return Array.from(resultMap.values());
    } catch (error) {
      console.error('Error fetching properties by renter email/phone:', error);
      return [];
    }
  }

  /**
   * Get properties where user is assigned as property manager
   */
  async getPropertiesByManagerEmail(managerEmail: string, managerPhone?: string): Promise<Property[]> {
    try {
      const propertiesCollection = collection(this.firestore, 'properties');
      const resultMap = new Map<string, Property>();

      if (managerEmail) {
        const emailQuery = query(propertiesCollection, where('propertyManagerEmailId', '==', managerEmail));
        const emailSnapshot = await getDocs(emailQuery);
        emailSnapshot.docs.forEach(docSnap => {
          resultMap.set(docSnap.id, mapDocToProperty(docSnap));
        });
      }

      if (managerPhone) {
        const phoneQuery = query(propertiesCollection, where('propertyManagerPhoneNumber', '==', managerPhone));
        const phoneSnapshot = await getDocs(phoneQuery);
        phoneSnapshot.docs.forEach(docSnap => {
          resultMap.set(docSnap.id, mapDocToProperty(docSnap));
        });
      }

      return Array.from(resultMap.values());
    } catch (error) {
      console.error('Error fetching manager properties:', error);
      return [];
    }
  }

  /**
   * Get properties by owner (combines ownerId and ownerEmail if available)
   */
  async getPropertiesByOwner(ownerId: string, ownerEmail?: string): Promise<Property[]> {
    try {
      const propertiesCollection = collection(this.firestore, 'properties');
      const resultMap = new Map<string, Property>();

      if (ownerId) {
        const idQuery = query(propertiesCollection, where('ownerId', '==', ownerId));
        const idSnapshot = await getDocs(idQuery);
        idSnapshot.docs.forEach(docSnap => resultMap.set(docSnap.id, mapDocToProperty(docSnap)));
      }

      if (ownerEmail) {
        const emailQuery = query(propertiesCollection, where('ownerEmailId', '==', ownerEmail));
        const emailSnapshot = await getDocs(emailQuery);
        emailSnapshot.docs.forEach(docSnap => resultMap.set(docSnap.id, mapDocToProperty(docSnap)));
      }

      return Array.from(resultMap.values());
    } catch (error) {
      console.error('Error fetching owner properties:', error);
      return [];
    }
  }

  /**
   * Update property
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
   * Delete property
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
   * Add a Renter agreement document (matching renter.dart)
   */
  async addRenter(renter: Partial<Renter>): Promise<string | null> {
    try {
      const rentersCollection = collection(this.firestore, 'renters');
      const docRef = await addDoc(rentersCollection, {
        ...renter,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding renter:', error);
      return null;
    }
  }

  /**
   * Get renter records by renter email (from 'renters' collection, and fallback to 'rentals')
   */
  async getRentersByRenterEmail(renterEmail: string, renterPhone?: string): Promise<Renter[]> {
    try {
      const resultMap = new Map<string, Renter>();

      // Check renters collection
      const rentersCollection = collection(this.firestore, 'renters');
      if (renterEmail) {
        const qEmail = query(rentersCollection, where('renterEmailId', '==', renterEmail));
        const snapEmail = await getDocs(qEmail);
        snapEmail.docs.forEach(d => resultMap.set(d.id, mapDocToRenter(d)));
      }
      if (renterPhone) {
        const qPhone = query(rentersCollection, where('renterPhoneNumber', '==', renterPhone));
        const snapPhone = await getDocs(qPhone);
        snapPhone.docs.forEach(d => resultMap.set(d.id, mapDocToRenter(d)));
      }

      // Check legacy rentals collection
      const rentalsCollection = collection(this.firestore, 'rentals');
      if (renterEmail) {
        const qRentals = query(rentalsCollection, where('renterEmail', '==', renterEmail));
        const snapRentals = await getDocs(qRentals);
        snapRentals.docs.forEach(d => resultMap.set(d.id, mapDocToRenter(d)));
      }

      return Array.from(resultMap.values());
    } catch (error) {
      console.error('Error fetching renters by email:', error);
      return [];
    }
  }

  /**
   * Get renter records by owner email (from 'renters' collection)
   */
  async getRentersByOwnerEmail(ownerEmail: string): Promise<Renter[]> {
    try {
      const rentersCollection = collection(this.firestore, 'renters');
      const q = query(rentersCollection, where('ownerEmailId', '==', ownerEmail));
      const snap = await getDocs(q);
      return snap.docs.map(d => mapDocToRenter(d));
    } catch (error) {
      console.error('Error fetching renters by owner email:', error);
      return [];
    }
  }

  /**
   * Create rental transaction (legacy support)
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
