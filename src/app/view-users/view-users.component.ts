import { Component, OnInit, NgZone } from '@angular/core';
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
export class ViewUsersComponent implements OnInit {

  searchText = '';
  users: any[] = [];
  loading = false;
  toast = '';

  constructor(private userService: UserService, private zone: NgZone) {}

  ngOnInit() { this.loadUsers(); }

  loadUsers() {
    this.loading = true;
    this.userService.getAll().subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.loading = false;
          this.users = Array.isArray(data) ? data : [];
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.loading = false;
          console.error('Failed to load users', err);
        });
      }
    });
  }

  get filteredUsers(): any[] {
    if (!this.searchText.trim()) return this.users;
    const q = this.searchText.toLowerCase();
    return this.users.filter(u =>
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  }

  refresh(event?: Event) {
    if (event) event.stopPropagation();
    this.searchText = '';
    this.loadUsers();
  }
}
