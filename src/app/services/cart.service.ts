import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface Cart {
  id: number;
  userEmail: string;
  items: CartItem[];
  grandTotal: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private apiUrl = `${environment.apiUrl}/api/cart`;
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  cart$ = this.cartSubject.asObservable();

  constructor(private http: HttpClient, private zone: NgZone) {}

  loadCart() {
    const token = localStorage.getItem('token');
    if (token) {
      this.http.get<Cart>(this.apiUrl).subscribe({
        next: (cart) => this.zone.run(() => this.cartSubject.next(cart)),
        error: () => this.zone.run(() => this.cartSubject.next(null))
      });
    }
  }

  getItems(): CartItem[] {
    return this.cartSubject.value?.items || [];
  }

  get grandTotal(): number {
    return this.cartSubject.value?.grandTotal || 0;
  }

  get count(): number {
    return this.getItems().reduce((sum, i) => sum + i.quantity, 0);
  }

  addItem(productCode: string, quantity: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, null, {
      params: { productCode, quantity: quantity.toString() }
    }).pipe(tap(() => this.loadCart()));
  }

  removeItem(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/remove/${id}`);
  }

  clear() {
    this.cartSubject.next(null);
  }
}
