import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  priceSort: 'none' | 'asc' | 'desc' = 'none';

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() { this.loadProducts(); }

  loadProducts() {
    this.loading = true;
    const role = localStorage.getItem('role');
    const fetch$ = role === 'USER' ? this.productService.getPublic() : this.productService.getAll();
    fetch$.subscribe({
      next: (data) => {
        this.loading = false;
        this.products = Array.isArray(data) ? data : [];
        this.products.forEach(p => this.quantities[p.productCode] = 1);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get filtered(): any[] {
    if (!this.searchText.trim()) {
      let result = this.products;
      return this.applyPriceSort(result);
    }
    const q = this.searchText.toLowerCase();
    const result = this.products.filter(p =>
      p.productName?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.model?.toLowerCase().includes(q)
    );
    return this.applyPriceSort(result);
  }

  private applyPriceSort(list: any[]): any[] {
    if (this.priceSort === 'asc') return [...list].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    if (this.priceSort === 'desc') return [...list].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    return list;
  }

  addToCart(p: any) {
    const qty = this.quantities[p.productCode] || 1;
    this.cartService.addItem(p.productCode, qty).subscribe({
      next: () => this.showToast(`${p.productName} added to cart`),
      error: () => this.showToast(`Failed to add to cart`)
    });
  }

  showToast(msg: string) {
    this.toast = msg;
    setTimeout(() => this.toast = '', 2500);
  }
}
