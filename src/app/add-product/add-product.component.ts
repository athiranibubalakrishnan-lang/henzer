import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService } from '../product.service';
import { CategoryService } from '../services/category.service';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.css']
})
export class AddProductComponent {

  productName = '';
  model = '';
  quality = '';
  sku = '';
  spec = '';
  price = 0;
  dealerPrice = 0;
  quantity = 0;
  status = 'APPROVED';
  selectedCategory = '';
  loading = false;
  toast = '';

  active = true;
  brand = 'Henzer';

  constructor(
    private productService: ProductService,
    public categoryService: CategoryService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe(params => {
      if (params['name']) this.productName = params['name'];
      if (params['brand']) this.brand = params['brand'];
      if (params['price']) this.price = +params['price'];
    });
  }

  get isDealer(): boolean {
    return localStorage.getItem('role') === 'DEALER';
  }

  get categories(): string[] {
    return this.categoryService.getCategories();
  }

  showToast(msg: string) {
    this.toast = msg;
    setTimeout(() => this.toast = '', 3000);
  }

  addProduct() {
    if (!this.selectedCategory) {
      this.showToast('Please select a category');
      return;
    }
    const payload = {
      productName: this.productName,
      model: this.model,
      quality: this.quality,
      sku: this.sku,
      price: this.price,
      dealerPrice: this.dealerPrice,
      quantity: this.quantity,
      status: this.status,
      category: this.selectedCategory,
      active: this.active,
      brand: this.brand
    };
    this.loading = true;
    this.productService.create(payload).subscribe({
      next: () => {
        this.loading = false;
        this.showToast('Product added successfully');
        this.resetForm();
        setTimeout(() => this.router.navigate(['/view-products']), 1500);
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        this.showToast('Failed to add product');
      }
    });
  }

  resetForm() {
    this.productName = '';
    this.model = '';
    this.quality = '';
    this.sku = '';
    this.spec = '';
    this.price = 0;
    this.dealerPrice = 0;
    this.quantity = 0;
    this.status = 'APPROVED';
    this.selectedCategory = '';
  }
}
