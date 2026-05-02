import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { ProductService } from '../product.service';
import { CategoryService } from '../services/category.service';
import { CartService } from '../services/cart.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-view-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './view.products.component.html',
  styleUrls: ['./view.products.component.css']
})
export class ViewProductsComponent implements OnInit {

  searchText = '';
  products: any[] = [];
  loading = false;
  toast = '';
  editingId: string | null = null;
  editPrice = 0;
  editDealerPrice = 0;
  editQuantity = 0;
  brandFilter = '';
  cartQuantities: { [key: string]: number } = {};

  constructor(
    private productService: ProductService,
    public categoryService: CategoryService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.brandFilter = params['brand'] || '';
      if (this.products.length === 0) {
        this.loadProducts();
      }
    });
  }

  showToast(msg: string) {
    this.toast = msg;
    setTimeout(() => this.toast = '', 3000);
  }

  loadProducts() {
    this.loading = true;
    const isGuest = !localStorage.getItem('token');
    const request = isGuest ? this.productService.getPublic() : this.productService.getAll();
    request.subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.loading = false;
          this.products = Array.isArray(data) ? data : [];
          this.products.forEach(p => {
            if (!this.cartQuantities[p.productCode]) {
              this.cartQuantities[p.productCode] = 1;
            }
          });
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.loading = false;
          console.error('Failed to load products', err);
        });
      }
    });
  }

  refresh() {
    this.searchText = '';
    this.loadProducts();
  }

  get categories(): string[] { return ['All Products']; }

  get isDealer(): boolean {
    return localStorage.getItem('role') === 'DEALER';
  }

  get isAdmin(): boolean {
    return localStorage.getItem('role') === 'ADMIN';
  }

  get isRegularUser(): boolean {
    return localStorage.getItem('role') === 'USER';
  }

  get isGuest(): boolean {
    return !localStorage.getItem('token');
  }

  get isPrivilegedUser(): boolean {
    return localStorage.getItem('role') === 'PRIVILEGE_USER';
  }

  addToCart(product: any) {
    this.showToast(`Adding ${product.productName} to cart...`);
    this.cartService.addItem(product.productCode, 1).subscribe({
      next: () => this.showToast(`✅ ${product.productName} added to cart`),
      error: () => this.showToast(`❌ Failed to add to cart`)
    });
  }

  addToCartWithQty(product: any) {
    const qty = this.cartQuantities[product.productCode] || 1;
    this.showToast(`Adding ${product.productName} x${qty} to cart...`);
    this.cartService.addItem(product.productCode, qty).subscribe({
      next: () => {
        this.cartQuantities[product.productCode] = 1;
        this.showToast(`✅ ${product.productName} x${qty} added to cart`);
      },
      error: () => this.showToast(`❌ Failed to add to cart`)
    });
  }

  getProductsByCategory(category: string): any[] {
    let filtered = this.products;

    // filter by brand if set (client-side, from query param)
    if (this.brandFilter) {
      filtered = filtered.filter(p =>
        p.model?.toLowerCase().includes(this.brandFilter.toLowerCase())
      );
    }

    // filter by search text
    if (this.searchText) {
      filtered = filtered.filter(p =>
        p.productName?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        p.sku?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        p.model?.toLowerCase().includes(this.searchText.toLowerCase())
      );
    }

    return filtered;
  }

  startEdit(p: any) {
    this.editingId = p.productCode;
    this.editPrice = p.price;
    this.editDealerPrice = p.dealerPrice;
    this.editQuantity = p.quantity;
  }

  cancelEdit() { this.editingId = null; }

  saveEdit(p: any) {
    if (!p.productCode) {
      console.error('productCode is missing on product:', p);
      this.showToast('Cannot update: product code missing');
      return;
    }

    const payload = {
      productCode: p.productCode,
      productName: p.productName,
      model: p.model,
      quality: p.quality,
      sku: p.sku,
      brand: p.brand,
      status: p.status,
      active: p.active,
      price: this.editPrice,
      dealerPrice: this.editDealerPrice,
      quantity: this.isDealer ? p.quantity : this.editQuantity
    };

    console.log('Updating product:', p.productCode, payload);

    this.productService.update(p.productCode, payload).subscribe({
      next: () => {
        this.zone.run(() => {
          p.price = this.editPrice;
          p.dealerPrice = this.editDealerPrice;
          p.quantity = this.isDealer ? p.quantity : this.editQuantity;
          this.editingId = null;
          this.showToast('Product updated successfully');
        });
      },
      error: (err) => {
        this.zone.run(() => {
          console.error('Update failed', err);
          this.showToast('Failed to update product');
        });
      }
    });
  }

  deleteProduct(p: any) {
    if (!confirm(`Delete "${p.productName}"?`)) return;
    console.log('Deleting product:', p.productCode);
    if (!p.productCode) {
      this.showToast('Cannot delete: product code missing');
      return;
    }
    this.productService.delete(p.productCode).subscribe({
      next: () => {
        this.zone.run(() => {
          this.products = this.products.filter(x => x.productCode !== p.productCode);
          this.showToast('Product deleted successfully');
        });
      },
      error: (err) => {
        this.zone.run(() => {
          console.error('Delete failed', err);
          this.showToast('Failed to delete product');
        });
      }
    });
  }
}
