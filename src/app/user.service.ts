// src/app/user.service.ts
import { Injectable } from '@angular/core';

export interface User {
  userName: string;
  email: string;
  role: string;
  status: string;
  password?: string; // optional
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private users: User[] = [
    { userName: 'admin', email: 'admin@example.com', role: 'ADMIN', status: 'ACTIVE' }
  ];

  getUsers(): User[] {
    return this.users;
  }

  addUser(user: User) {
    this.users.push(user);
  }

  deleteUser(index: number) {
    this.users.splice(index, 1);
  }
}
