import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../services/category.service';

@Component({
  selector: 'app-add-category',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.css']
})
export class AddCategoryComponent {

  categoryName: string = '';

  constructor(public categoryService: CategoryService) {}

  get categories(): string[] {
    return this.categoryService.getCategories();
  }

  addCategory() {
    this.categoryService.addCategory(this.categoryName);
    this.categoryName = '';
  }

  deleteCategory(index: number) {
    this.categoryService.deleteCategory(index);
  }
}