import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private apiUrl = `${environment.apiUrl}/api/cart`;

  constructor(private http: HttpClient) {}

  // GET CART
  getCart(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // ADD TO CART
  addToCart(product: any): Observable<any> {
    return this.http.post(this.apiUrl, product);
  }

  // DELETE ITEM
  removeFromCart(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
