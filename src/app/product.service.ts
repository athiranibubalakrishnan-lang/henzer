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
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private products: Product[] = [
    {
      product: 'IPHONE',
      model: '11 PROMAX',
      brand: 'HENZER',
      spec: 'HARD OLED Change IC',
      quantity: 10,
      sku: 'IP11-001',
      price: 165,
      active: true
    },
    {
      product: 'IPHONE',
      model: '12 PRO',
      brand: 'HENZER',
      spec: 'HARD OLED Change IC',
      quantity: 10,
      sku: 'IP12-002',
      price: 158,
      active: true
    }
  ];

  getProducts(): Product[] {
    return this.products;
  }

  addProduct(p: Product) {
    this.products.push(p);
  }

  deleteProduct(index: number) {
    this.products.splice(index, 1);
  }
}
