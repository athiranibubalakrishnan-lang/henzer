import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProductManagementRequest {
  action: 'ASSIGN' | 'UPDATE_PRICE' | 'FINALIZE_PRICE';
  // ASSIGN always uses lists (even for a single item)
  productIds?: number[];
  dealerIds?: number[];
  // UPDATE_PRICE / FINALIZE_PRICE always use single scalar values
  dealerId?: number;
  productId?: number;
  price?: number;
}

@Injectable({ providedIn: 'root' })
export class ProductManagementService {
  private base = `${environment.apiUrl}/api/products/process`;

  constructor(private http: HttpClient) {}

  /**
   * ASSIGN — always sends productIds[] + dealerIds[] as lists,
   * even when only one item is selected.
   * responseType 'text' because the backend returns a plain 200 string.
   */
  assign(productIds: number[], dealerIds: number[], price?: number): Observable<any> {
    const body: ProductManagementRequest = { action: 'ASSIGN', productIds, dealerIds };
    if (price !== undefined && price !== null) body.price = price;
    return this.http.post(this.base, body, { responseType: 'text' });
  }

  /**
   * UPDATE_PRICE — scalar productId + dealerId (never lists).
   * Uses POST to match @PostMapping("/process") on the backend.
   */
  updatePrice(dealerId: number, productId: number, price: number): Observable<any> {
    const body: ProductManagementRequest = { action: 'UPDATE_PRICE', dealerId, productId, price };
    return this.http.post(this.base, body, { responseType: 'text' });
  }

  /**
   * FINALIZE_PRICE — scalar productId + dealerId, no price needed.
   */
  finalizePrice(dealerId: number, productId: number): Observable<any> {
    const body: ProductManagementRequest = { action: 'FINALIZE_PRICE', dealerId, productId };
    return this.http.post(this.base, body, { responseType: 'text' });
  }
}
