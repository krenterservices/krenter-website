import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private users = [
    { id: 1, name: 'Test User', email: 'test@example.com' },
    { id: 2, name: 'Property Owner', email: 'owner@example.com' },
  ];

  getUserById(id: number) {
    return this.users.find((u) => u.id === id);
  }
  updateUser(id: number) {
    return this.users.find((u) => u.id === id);
  }
}
