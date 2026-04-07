import { Component, OnInit } from '@angular/core';
import { ProductService } from '../product.service';
import { CategoryService } from '../services/category.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  constructor(
    private productService: ProductService,
    public categoryService: CategoryService
  ) {}

  ngOnInit() { this.loadProducts(); }

  showToast(msg: string) {
    this.toast = msg;
    setTimeout(() => this.toast = '', 3000);
  }

  loadProducts() {
    this.loading = true;
    this.productService.getAll().subscribe({
      next: (data) => {
        this.loading = false;
        this.products = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load products', err);
      }
    });
  }

  get categories(): string[] { return ['All Products']; }

  getProductsByCategory(category: string): any[] {
    if (!this.searchText) return this.products;
    return this.products.filter(p =>
      p.productName?.toLowerCase().includes(this.searchText.toLowerCase()) ||
      p.sku?.toLowerCase().includes(this.searchText.toLowerCase()) ||
      p.model?.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  startEdit(p: any) {
    this.editingId = p.productCode;
    this.editPrice = p.price;
    this.editDealerPrice = p.dealerPrice;
    this.editQuantity = p.quantity;
  }

  cancelEdit() { this.editingId = null; }

  saveEdit(p: any) {
    const payload = {
      productName: p.productName,
      model: p.model,
      quality: p.quality,
      sku: p.sku,
      brand: p.brand,
      status: p.status,
      active: p.active,
      price: this.editPrice,
      dealerPrice: this.editDealerPrice,
      quantity: this.editQuantity
    };
    this.productService.update(p.productCode, payload).subscribe({
      next: () => {
        p.price = this.editPrice;
        p.dealerPrice = this.editDealerPrice;
        p.quantity = this.editQuantity;
        this.editingId = null;
        this.showToast('Product updated successfully');
      },
      error: (err) => {
        console.error('Update failed', err);
        this.showToast('Failed to update product');
      }
    });
  }

  deleteProduct(p: any) {
    if (!confirm(`Delete "${p.productName}"?`)) return;
    this.productService.delete(p.productCode).subscribe({
      next: () => {
        this.products = this.products.filter(x => x.productCode !== p.productCode);
        this.showToast('Product deleted successfully');
      },
      error: (err) => {
        console.error('Delete failed', err);
        this.showToast('Failed to delete product');
      }
    });
  }
}
