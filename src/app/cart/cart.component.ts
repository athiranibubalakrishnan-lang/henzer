import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService, CartItem, Cart } from '../services/cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  showThankYou = false;

  constructor(public cartService: CartService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    // Subscribe first, then trigger load
    this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
      this.cdr.markForCheck();
    });
    // Small delay ensures subscription is active before data arrives
    setTimeout(() => this.cartService.loadCart(), 0);
  }

  remove(item: CartItem) {
    this.cartService.removeItem(item.id).subscribe({
      next: () => {
        this.cartService.loadCart();
      },
      error: () => console.error('Failed to remove item')
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
      this.showThankYou = true;
      setTimeout(() => {
        this.showThankYou = false;
        this.cartService.clear();
        this.router.navigate(['/home']);
      }, 2500);
    }
  }
}
