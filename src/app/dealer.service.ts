import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Dealer {
  dealerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber?: string;
  status: string;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class DealerService {
  private base = `${environment.apiUrl}/api/dealers`;

  constructor(private http: HttpClient) {}

  create(dealer: Dealer): Observable<any> {
    return this.http.post(this.base, dealer, { responseType: 'text' });
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.base);
  }

  getById(id: number): Observable<any> {
    return this.http.get(`${this.base}/${id}`);
  }

  update(id: number, dealer: Dealer): Observable<any> {
    return this.http.put(`${this.base}/${id}`, dealer, { responseType: 'text' });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.base}/${id}`, { responseType: 'text' });
  }
}
