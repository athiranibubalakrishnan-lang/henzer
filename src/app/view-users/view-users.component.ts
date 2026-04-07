import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../user.service';

@Component({
  selector: 'app-view-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './view-users.component.html',
  styleUrls: ['./view-users.component.css']
})
export class ViewUsersComponent {

  searchEmail = '';
  user: any = null;
  notFound = false;
  loading = false;
  toast = '';

  constructor(private userService: UserService) {}

  showToast(msg: string) {
    this.toast = msg;
    setTimeout(() => this.toast = '', 3000);
  }

  search() {
    if (!this.searchEmail.trim()) return;
    this.loading = true;
    this.user = null;
    this.notFound = false;

    this.userService.getByEmail(this.searchEmail.trim()).subscribe({
      next: (data) => {
        this.loading = false;
        // handle both array and object responses
        this.user = Array.isArray(data) ? data[0] : data;
        if (!this.user) this.notFound = true;
      },
      error: () => {
        this.loading = false;
        this.notFound = true;
      }
    });
  }

  clear() {
    this.searchEmail = '';
    this.user = null;
    this.notFound = false;
  }
}
