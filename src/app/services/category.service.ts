import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private categories: string[] = ['HENZER', 'Silica', 'Silica Lite'];

  getCategories(): string[] {
    return this.categories;
  }

  addCategory(name: string) {
    if (name.trim() && !this.categories.includes(name.trim())) {
      this.categories.push(name.trim());
    }
  }

  deleteCategory(index: number) {
    this.categories.splice(index, 1);
  }
}
