import { Injectable } from '@angular/core';

export interface CartItem {
  name: string;
  brand: string;
  price: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private items: CartItem[] = [];

  getItems(): CartItem[] { return this.items; }

  addItem(product: { name: string; brand: string; price: number }) {
    const existing = this.items.find(i => i.name === product.name);
    if (existing) {
      existing.quantity++;
    } else {
      this.items.push({ ...product, quantity: 1 });
    }
  }

  increaseQty(index: number) {
    this.items[index].quantity++;
  }

  decreaseQty(index: number) {
    if (this.items[index].quantity > 1) {
      this.items[index].quantity--;
    } else {
      this.removeItem(index);
    }
  }

  removeItem(index: number) {
    this.items.splice(index, 1);
  }

  get total(): number {
    return this.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  get count(): number {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  clear() { this.items = []; }
}
