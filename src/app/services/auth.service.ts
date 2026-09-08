import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, authState, User } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { UserService } from './user.service';
import { map, switchMap, firstValueFrom } from 'rxjs';

export interface KrenterUser {
  uid: string;
  email: string;
  name: string;
  role: 'owner' | 'renter'; // owner or renter
  phone?: string;
  profilePicture?: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<KrenterUser | null>(null);
  public currentUser = this.currentUserSubject.asObservable();
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
    });
  }

  /**
   * Load user profile from Firestore
   */
  private loadUserProfile(uid: string): Observable<KrenterUser | null> {
    return new Observable(observer => {
      const userDocRef = doc(this.firestore, 'users', uid);
      getDoc(userDocRef).then(doc => {
        if (doc.exists()) {
          const userData = doc.data() as KrenterUser;
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
    name: string,
    email: string,
    password: string,
    role: 'owner' | 'renter'
  }) {
    let userCredential = null;
    try {
      this.isLoading.next(true);

      // Create Firebase Auth user
      userCredential = await createUserWithEmailAndPassword(
        this.auth,
        userData.email,
        userData.password
      );

    } catch (error: any) {
      this.isLoading.next(false);
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }

    try {

      const firebaseUser = userCredential.user;

      // Create user profile in Firestore
      const krenterUser: KrenterUser = {
        uid: firebaseUser.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        createdAt: new Date()
      };

      await setDoc(doc(this.firestore, 'users', firebaseUser.uid), krenterUser);

      this.currentUserSubject.next(krenterUser);
      this.isLoading.next(false);
      this.router.navigate(['/']);
      return { success: true };
    } catch (error: any) {
      this.isLoading.next(false);
      console.error('After registration, creating user error:', error);
      return { success: false, error: error.message };
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
        this.router.navigate(['/']);
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
