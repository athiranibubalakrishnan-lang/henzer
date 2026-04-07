import { Component } from '@angular/core';
import { ProductService, Product } from '../product.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-view-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './view.products.component.html',
  styleUrls: ['./view.products.component.css']
})
export class ViewProductsComponent {

  searchText = '';

  constructor(public productService: ProductService) {}

  get products(): Product[] {
    return this.productService.getProducts();
  }

  get filteredProducts(): Product[] {
    return this.products.filter(p =>
      !this.searchText ||
      p.product.toLowerCase().includes(this.searchText.toLowerCase()) ||
      p.brand.toLowerCase().includes(this.searchText.toLowerCase()) ||
      p.model.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  deleteProduct(i: number) {
    this.productService.deleteProduct(i);
  }

}
