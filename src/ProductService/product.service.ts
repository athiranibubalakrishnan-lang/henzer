// src/app/product.service.ts
import { Injectable } from '@angular/core';

export interface Product {
  product: string;
  model: string;
  brand: string;
  spec: string;
  quantity: number;
  sku: string;
  price: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private products: Product[] = [
    {
      product: 'IPHONE',
      model: '11 PROMAX',
      brand: 'HENZER',
      spec: 'HARD OLED Change IC',
      quantity: 10,
      sku: '',
      price: 165
    },
    {
      product: 'IPHONE',
      model: '12 PRO',
      brand: 'HENZER',
      spec: 'HARD OLED Change IC',
      quantity: 10,
      sku: '',
      price: 158
    }
  ];

  getProducts() {
    return this.products;
  }

  addProduct(p: Product) {
    this.products.push(p);
  }

  deleteProduct(index: number) {
    this.products.splice(index, 1);
  }
}
