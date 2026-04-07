import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';   

@Component({
  selector: 'app-add-category',
  standalone: true,
  imports: [CommonModule,FormsModule], 
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.css']
})
export class AddCategoryComponent {

  categoryName: string = '';
  categories: string[] = [];

  addCategory() {
    if (this.categoryName.trim() !== '') {
      this.categories.push(this.categoryName);
      this.categoryName = '';
    }
  }

  deleteCategory(index: number) {
    this.categories.splice(index, 1);
  }

}