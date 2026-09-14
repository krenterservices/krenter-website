import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, authState, User } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { UserService } from './user.service';
import { map, switchMap, firstValueFrom } from 'rxjs';

export interface KrenterUser {
  id?: string;
  uid: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  profilePicture?: string;
  role?: 'owner' | 'renter' | 'manager' | 'both' | 'admin' | string;
  roles?: ('owner' | 'renter' | 'manager' | 'admin')[];
  createdAt: Date;
}

export function isUserAdmin(user: KrenterUser | null | undefined): boolean {
  if (!user) return false;
  return (
    user.email?.toLowerCase() === 'krenterservices@gmail.com' ||
    user.roles?.includes('admin' as any) === true ||
    user.role === 'admin'
  );
}

export function isUserOwner(user: KrenterUser | null | undefined): boolean {
  if (!user) return false;
  return (
    user.roles?.includes('owner') === true ||
    user.role === 'owner' ||
    user.role === 'both' ||
    (typeof user.role === 'string' && user.role.toLowerCase().includes('owner'))
  );
}

export function isUserRenter(user: KrenterUser | null | undefined): boolean {
  if (!user) return false;
  return (
    user.roles?.includes('renter') === true ||
    user.role === 'renter' ||
    user.role === 'both' ||
    (typeof user.role === 'string' && user.role.toLowerCase().includes('renter'))
  );
}

export function isUserManager(user: KrenterUser | null | undefined): boolean {
  if (!user) return false;
  return (
    user.roles?.includes('manager') === true ||
    user.role === 'manager' ||
    (typeof user.role === 'string' &&
      (user.role.toLowerCase().includes('manager') ||
        user.role.toLowerCase().includes('propertymanager')))
  );
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<KrenterUser | null>(null);
  private authReadySubject = new BehaviorSubject<boolean>(false);
  public currentUser = this.currentUserSubject.asObservable();
  public authReady = this.authReadySubject.asObservable();
  public isLoading = new BehaviorSubject<boolean>(false);

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private userService: UserService
  ) {
    // Listen to auth state changes
    authState(this.auth).pipe(
      switchMap(user => {
        if (user) {
          return this.loadUserProfile(user.uid);
        }
        return [null];
      })
    ).subscribe(userProfile => {
      this.currentUserSubject.next(userProfile);
      this.authReadySubject.next(true);
    });
  }

  public isOwner(user: KrenterUser | null | undefined = this.currentUserSubject.value): boolean {
    return isUserOwner(user);
  }

  public isRenter(user: KrenterUser | null | undefined = this.currentUserSubject.value): boolean {
    return isUserRenter(user);
  }

  public isManager(user: KrenterUser | null | undefined = this.currentUserSubject.value): boolean {
    return isUserManager(user);
  }

  public isAdmin(user: KrenterUser | null | undefined = this.currentUserSubject.value): boolean {
    return isUserAdmin(user);
  }

  /**
   * Load user profile from Firestore
   */
  private loadUserProfile(uid: string): Observable<KrenterUser | null> {
    return new Observable(observer => {
      const userDocRef = doc(this.firestore, 'users', uid);
      getDoc(userDocRef).then(docSnap => {
        if (docSnap.exists()) {
          const raw = docSnap.data() as any;
          const firstName = raw.firstName || '';
          const lastName = raw.lastName || '';
          const computedName = raw.name || `${firstName} ${lastName}`.trim() || raw.email || 'User';

          // Reconcile roles array
          const roles: ('owner' | 'renter' | 'manager')[] = raw.roles ? [...raw.roles] : [];
          if (raw.role) {
            if (raw.role === 'both') {
              if (!roles.includes('owner')) roles.push('owner');
              if (!roles.includes('renter')) roles.push('renter');
            } else if (['owner', 'renter', 'manager'].includes(raw.role)) {
              if (!roles.includes(raw.role)) roles.push(raw.role);
            }
          }

          const userData: KrenterUser = {
            id: uid,
            uid: uid,
            email: raw.email,
            name: computedName,
            firstName,
            lastName,
            phone: raw.phone || '',
            address: raw.address || '',
            profilePicture: raw.profilePicture,
            roles: roles.length > 0 ? roles : ['renter'],
            role: raw.role || (roles.includes('owner') && roles.includes('renter') ? 'both' : (roles[0] || 'renter')),
            createdAt: raw.createdAt?.toDate ? raw.createdAt.toDate() : (raw.createdAt ? new Date(raw.createdAt) : new Date())
          };
          observer.next(userData);
        } else {
          observer.next(null);
        }
        observer.complete();
      }).catch(error => {
        console.error('Error loading user profile:', error);
        observer.next(null);
        observer.complete();
      });
    });
  }

  /**
   * Register new user with Firebase
   */
  async register(userData: {
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
    password?: string;
    phone?: string;
    address?: string;
    isOwner?: boolean;
    isRenter?: boolean;
    isManager?: boolean;
    roles?: ('owner' | 'renter' | 'manager')[];
    role?: 'owner' | 'renter' | 'manager' | 'both' | string;
  }) {
    let userCredential = null;
    try {
      this.isLoading.next(true);

      // Create Firebase Auth user
      userCredential = await createUserWithEmailAndPassword(
        this.auth,
        userData.email,
        userData.password || ''
      );

    } catch (error: any) {
      this.isLoading.next(false);
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }

    try {
      const firebaseUser = userCredential.user;

      // Determine roles
      const roles: ('owner' | 'renter' | 'manager')[] = userData.roles ? [...userData.roles] : [];
      if (userData.isOwner && !roles.includes('owner')) roles.push('owner');
      if (userData.isRenter && !roles.includes('renter')) roles.push('renter');
      if (userData.isManager && !roles.includes('manager')) roles.push('manager');

      if (roles.length === 0) {
        if (userData.role) {
          if (userData.role === 'both') {
            roles.push('owner', 'renter');
          } else if (['owner', 'renter', 'manager'].includes(userData.role)) {
            roles.push(userData.role as any);
          }
        } else {
          roles.push('renter');
        }
      }

      let roleStr: string = roles[0];
      if (roles.includes('owner') && roles.includes('renter')) {
        roleStr = 'both';
      } else if (roles.length > 1) {
        roleStr = roles.join('&');
      }

      const firstName = userData.firstName || '';
      const lastName = userData.lastName || '';
      const fullName = (userData.name || `${firstName} ${lastName}`).trim() || userData.email;

      // Create user profile in Firestore aligned with krenter_user.dart
      const krenterUser: KrenterUser = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        firstName,
        lastName,
        name: fullName,
        email: userData.email,
        phone: userData.phone || '',
        address: userData.address || '',
        roles,
        role: roleStr as any,
        createdAt: new Date()
      };

      await setDoc(doc(this.firestore, 'users', firebaseUser.uid), {
        id: firebaseUser.uid,
        firstName,
        lastName,
        email: userData.email,
        phone: userData.phone || '',
        address: userData.address || '',
        name: fullName,
        roles,
        role: roleStr,
        createdAt: new Date()
      });

      this.currentUserSubject.next(krenterUser);
      this.isLoading.next(false);
      await this.router.navigate(['/dashboard']);
      return { success: true };
    } catch (error: any) {
      this.isLoading.next(false);
      console.error('After registration, creating user error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark user as owner (e.g. when onboarding a property)
   */
  async markUserAsOwner(uid: string): Promise<boolean> {
    try {
      const userDocRef = doc(this.firestore, 'users', uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) return false;

      const raw = userSnap.data() as any;
      const roles: ('owner' | 'renter' | 'manager')[] = raw.roles ? [...raw.roles] : [];
      if (raw.role) {
        if (raw.role === 'both') {
          if (!roles.includes('owner')) roles.push('owner');
          if (!roles.includes('renter')) roles.push('renter');
        } else if (['owner', 'renter', 'manager'].includes(raw.role)) {
          if (!roles.includes(raw.role)) roles.push(raw.role);
        }
      }

      if (!roles.includes('owner')) {
        roles.push('owner');
      }

      const roleStr = roles.includes('renter') ? 'both' : 'owner';

      await setDoc(userDocRef, {
        roles,
        role: roleStr
      }, { merge: true });

      if (this.currentUserSubject.value?.uid === uid) {
        const updatedUser: KrenterUser = {
          ...this.currentUserSubject.value,
          roles,
          role: roleStr as any
        };
        this.currentUserSubject.next(updatedUser);
      }
      return true;
    } catch (error) {
      console.error('Error marking user as owner:', error);
      return false;
    }
  }

  /**
   * Login user with Firebase
   */
  async login(credentials: { email: string, password: string }) {
    try {
      this.isLoading.next(true);

      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password
      );

      const firebaseUser = userCredential.user;
      const userProfile = await firstValueFrom(this.loadUserProfile(firebaseUser.uid));

      if (userProfile) {
        this.currentUserSubject.next(userProfile);
        this.isLoading.next(false);
        const navigated = await this.router.navigate(['/dashboard']);

        if (!navigated) {
          return { success: false, error: 'Unable to open your dashboard. Please try again.' };
        }

        return { success: true };
      } else {
        this.isLoading.next(false);
        return { success: false, error: 'User profile not found' };
      }
    } catch (error: any) {
      this.isLoading.next(false);
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      this.isLoading.next(true);
      await signOut(this.auth);
      this.currentUserSubject.next(null);
      this.isLoading.next(false);
      this.router.navigate(['/login']);
    } catch (error) {
      this.isLoading.next(false);
      console.error('Logout error:', error);
    }
  }

  /**
   * Get current user synchronously (returns null if not logged in)
   */
  getCurrentUserSync(): KrenterUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  /**
   * Get current user as Observable
   */
  getCurrentUser(): Observable<KrenterUser | null> {
    return this.currentUser;
  }
}
