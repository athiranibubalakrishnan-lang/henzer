import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface User {
  userName: string;
  email: string;
  role: string;
  status: string;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private base = `${environment.apiUrl}/api/users`;

  constructor(private http: HttpClient) {}

  create(user: User): Observable<any> {
    return this.http.post(this.base, user, { responseType: 'text' });
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.base);
  }

  getByEmail(email: string): Observable<any> {
    return this.http.get(`${this.base}/${email}`);
  }
}
