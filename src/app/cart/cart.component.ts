import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CartService, CartItem, Cart } from '../services/cart.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { forkJoin } from 'rxjs';

interface Address {
  addressLine1: string;
  addressLine2: string;
  landMark:     string;
  city:         string;
  state:        string;
  pinCode:      string;
  mobile:       string;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  showThankYou    = false;
  showAddressForm = false;
  orderLoading    = false;
  orderError      = '';

  // Delete confirmation
  itemToDelete: CartItem | null = null;

  address: Address = {
    addressLine1: '',
    addressLine2: '',
    landMark:     '',
    city:         '',
    state:        '',
    pinCode:      '',
    mobile:       ''
  };

  constructor(
    public cartService: CartService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
      this.cdr.markForCheck();
    });
    setTimeout(() => this.cartService.loadCart(), 0);
  }

  remove(item: CartItem) {
    this.cartService.removeItem(item.id).subscribe({
      next: () => this.cartService.loadCart(),
      error: () => console.error('Failed to remove item')
    });
  }

  confirmDelete(item: CartItem) {
    this.itemToDelete = item;
  }

  cancelDelete() {
    this.itemToDelete = null;
  }

  doDelete() {
    if (!this.itemToDelete) return;
    this.remove(this.itemToDelete);
    this.itemToDelete = null;
  }

  decreaseQty(item: CartItem) {
    if (item.quantity <= 1) {
      this.remove(item);
      return;
    }
    this.cartService.updateQty(item.id, item.quantity - 1).subscribe({
      error: () => console.error('Failed to update quantity')
    });
  }

  increaseQty(item: CartItem) {
    this.cartService.updateQty(item.id, item.quantity + 1).subscribe({
      error: () => console.error('Failed to update quantity')
    });
  }

  continueShopping() { this.router.navigate(['/view-products']); }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  checkout() {
    if (!this.isLoggedIn) {
      this.router.navigate(['/userlogin'], { queryParams: { returnUrl: '/cart' } });
    } else {
      this.orderError      = '';
      this.showAddressForm = true;
    }
  }

  closeAddressForm() {
    this.showAddressForm = false;
    this.orderError      = '';
  }

  placeOrder() {
    // Validate required fields
    if (!this.address.addressLine1.trim() || !this.address.city.trim() ||
        !this.address.state.trim() || !this.address.pinCode.trim() || !this.address.mobile.trim()) {
      this.orderError = 'Please fill in all required fields.';
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const items   = this.cart?.items ?? [];

    if (items.length === 0) {
      this.orderError = 'Your cart is empty.';
      return;
    }

    this.orderLoading = true;
    this.orderError   = '';

    // Place one order per cart item
    const requests = items.map(item => {
      // productCode from cart item directly, or fall back to stored map
      const productCode = item.productCode || this.cartService.getProductCode(item.productId);
      return this.http.post(
        `${environment.apiUrl}/api/orders/place-order`,
        {
          productCode,
          quantity: item.quantity,
          address:  { ...this.address }
        },
        { headers, responseType: 'text' as 'json' }
      );
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.orderLoading    = false;
        this.showAddressForm = false;
        this.showThankYou    = true;
        setTimeout(() => {
          this.showThankYou = false;
          this.cartService.clear();
          this.cartService.clearProductCodeMap();
          this.router.navigate(['/home']);
        }, 2500);
      },
      error: (err) => {
        this.orderLoading = false;
        this.orderError   = err?.error || 'Failed to place order. Please try again.';
      }
    });
  }
}
