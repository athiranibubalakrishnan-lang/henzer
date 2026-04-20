import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Product {
  id?: number;
  productName: string;
  model: string;
  quality: string;
  sku: string;
  price: number;
  dealerPrice: number;
  quantity: number;
  status: string;
  category: string;
  active: boolean;
  brand: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private base = `${environment.apiUrl}/api/products`;

  constructor(private http: HttpClient) {}

  create(payload: Partial<Product>): Observable<any> {
    return this.http.post(`${this.base}/create`, payload);
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.base);
  }

  getPublic(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/api/products/bypass-authorization`);
  }

  update(productCode: string, payload: any): Observable<any> {
    return this.http.put(`${this.base}/${productCode}`, payload, { responseType: 'text' });
  }

  delete(productCode: string): Observable<any> {
    return this.http.delete(`${this.base}/${productCode}`, { responseType: 'text' });
  }
}
