import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProductService } from '../product.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.css']
})
export class AddProductComponent implements OnInit {

  productName = '';
  category = '';
  sku = '';
  supplierCode = '';
  supplierPrice = 0;
  shortDescription = '';
  description = '';
  productDescription = '';
  remarks = '';
  inStock = true;
  visibility = 'PUBLIC';
  publishedStatus = true;
  active = true;
  status = 'PENDING';
  brand = '';
  loading = false;
  toast = '';

  constructor(
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['name']) this.productName = params['name'];
      if (params['brand']) this.brand = params['brand'];
      if (params['price']) this.supplierPrice = +params['price'];
    });
  }

  get isDealer(): boolean {
    return localStorage.getItem('role') === 'DEALER';
  }

  showToast(msg: string) {
    this.toast = msg;
    setTimeout(() => this.toast = '', 3000);
  }

  addProduct() {
    if (!this.productName.trim())  { this.showToast('Product name is required'); return; }
    if (!this.category)            { this.showToast('Category is required'); return; }
    if (!this.brand.trim())        { this.showToast('Brand is required'); return; }
    if (!this.sku.trim())          { this.showToast('SKU is required'); return; }
    if (!this.supplierPrice && this.supplierPrice !== 0) { this.showToast('Supplier price is required'); return; }
    const payload = {
      productName: this.productName,
      category: this.category,
      sku: this.sku,
      supplierCode: this.supplierCode,
      supplierPrice: this.supplierPrice,
      shortDescription: this.shortDescription,
      description: this.description,
      productDescription: this.productDescription,
      remarks: this.remarks,
      inStock: this.inStock,
      visibility: 'PUBLIC',
      visibilityInCatalog: 'visible',
      publishedStatus: this.publishedStatus,
      active: this.active,
      status: this.status,
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
    this.category = '';
    this.sku = '';
    this.supplierCode = '';
    this.supplierPrice = 0;
    this.shortDescription = '';
    this.description = '';
    this.productDescription = '';
    this.remarks = '';
    this.inStock = true;
    this.visibility = 'PUBLIC';
    this.publishedStatus = true;
    this.active = true;
    this.status = 'PENDING';
  }
}
