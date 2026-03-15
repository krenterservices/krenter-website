import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser = this.currentUserSubject.asObservable();

  constructor(private router: Router, private userService: UserService) { }

  login(credentials: { email: string, password: string }) {
    let user = null;
    if (credentials.email === 'test@example.com' && credentials.password === 'password') {
      user = this.userService.getUserById(1);
    } else if (credentials.email === 'owner@example.com' && credentials.password === 'password') {
      user = this.userService.getUserById(2);
    }

    if (user) {
      this.currentUserSubject.next(user);
      this.router.navigate(['/']);
      return true;
    }
    return false;
  }

  register(user: { name: string, email: string, password: string }) {
    // This would be more complex in a real app
    const newUser = { id: 3, ...user };
    this.currentUserSubject.next(newUser);
    this.router.navigate(['/']);
    return true;
  }

  logout() {
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }
}
