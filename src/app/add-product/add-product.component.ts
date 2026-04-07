import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../product.service';

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
  brand = '';
  spec = '';
  quantity = 1;
  sku = '';
  price = 0;
  active = true;

  constructor(private productService: ProductService) {}

  addProduct() {
    const newProduct: Product = {
      product: this.productName,
      model: this.model,
      brand: this.brand,
      spec: this.spec,
      quantity: this.quantity,
      sku: this.sku,
      price: this.price,
      active: this.active
    };

    this.productService.addProduct(newProduct);
    alert('Product added successfully');

    // Reset form
    this.productName = '';
    this.model = '';
    this.brand = '';
    this.spec = '';
    this.quantity = 1;
    this.sku = '';
    this.price = 0;
    this.active = true;
  }

}
