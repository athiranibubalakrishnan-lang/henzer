import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface CartItem {
  id: number;
  productId: number;
  productCode: string;
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

  addItem(productCode: string, quantity: number, price?: number): Observable<any> {
    const params: any = { productCode, quantity: quantity.toString() };
    if (price !== undefined && price !== null) {
      params.price = price.toString();
    }
    return this.http.post(`${this.apiUrl}/add`, null, { params })
      .pipe(tap(() => this.loadCart()));
  }

  /** Store productCode keyed by productId so we can look it up at checkout */
  storeProductCode(productId: number | string, productCode: string) {
    const map = this.getProductCodeMap();
    map[String(productId)] = productCode;
    localStorage.setItem('cartProductCodes', JSON.stringify(map));
  }

  getProductCode(productId: number | string): string {
    return this.getProductCodeMap()[String(productId)] ?? '';
  }

  private getProductCodeMap(): Record<string, string> {
    try {
      return JSON.parse(localStorage.getItem('cartProductCodes') || '{}');
    } catch { return {}; }
  }

  clearProductCodeMap() {
    localStorage.removeItem('cartProductCodes');
  }

  /** Store supplier price keyed by productCode for cart display */
  storeSupplierPrice(productCode: string, price: number) {
    const map = this.getSupplierPriceMap();
    map[productCode] = price;
    localStorage.setItem('cartSupplierPrices', JSON.stringify(map));
  }

  getSupplierPrice(productCode: string): number | null {
    return this.getSupplierPriceMap()[productCode] ?? null;
  }

  private getSupplierPriceMap(): Record<string, number> {
    try {
      return JSON.parse(localStorage.getItem('cartSupplierPrices') || '{}');
    } catch { return {}; }
  }

  clearSupplierPriceMap() {
    localStorage.removeItem('cartSupplierPrices');
  }

  updateQty(cartItemId: number, quantity: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/update/${cartItemId}`, null, {
      params: { quantity: quantity.toString() }
    }).pipe(tap(() => this.loadCart()));
  }

  removeItem(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/remove/${id}`);
  }

  clear() {
    this.cartSubject.next(null);
  }
}
