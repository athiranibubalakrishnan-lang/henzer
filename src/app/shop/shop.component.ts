import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../product.service';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.css']
})
export class ShopComponent implements OnInit {

  products: any[] = [];
  loading = false;
  searchText = '';
  toast = '';
  quantities: { [key: string]: number } = {};

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private zone: NgZone
  ) {}

  ngOnInit() { this.loadProducts(); }

  loadProducts() {
    this.loading = true;
    this.productService.getAll().subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.loading = false;
          this.products = Array.isArray(data) ? data : [];
          this.products.forEach(p => this.quantities[p.productCode] = 1);
        });
      },
      error: () => {
        this.zone.run(() => { this.loading = false; });
      }
    });
  }

  get filtered(): any[] {
    if (!this.searchText.trim()) return this.products;
    const q = this.searchText.toLowerCase();
    return this.products.filter(p =>
      p.productName?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.model?.toLowerCase().includes(q)
    );
  }

  addToCart(p: any) {
    const qty = this.quantities[p.productCode] || 1;
    for (let i = 0; i < qty; i++) {
      this.cartService.addItem({ name: p.productName, brand: p.brand, price: p.price });
    }
    this.showToast(`${p.productName} added to cart`);
  }

  showToast(msg: string) {
    this.toast = msg;
    setTimeout(() => this.toast = '', 2500);
  }
}
