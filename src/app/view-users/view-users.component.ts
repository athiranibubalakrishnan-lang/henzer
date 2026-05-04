import { Component, OnInit, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../user.service';
import { environment } from '../../environments/environment';

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
  customerGroups: any[] = [];
  editingEmail: string | null = null;
  editGroupId: number | null = null;

  constructor(private userService: UserService, private zone: NgZone, private http: HttpClient) {}

  ngOnInit() {
    this.loadUsers();
    this.loadCustomerGroups();
  }

  loadCustomerGroups() {
    this.http.get<any[]>(`${environment.apiUrl}/api/customer-groups`).subscribe({
      next: (data) => this.customerGroups = Array.isArray(data) ? data : [],
      error: () => {}
    });
  }

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

  startEditGroup(u: any) {
    this.editingEmail = u.email;
    this.editGroupId = u.customerGroupId || null;
  }

  cancelEditGroup() {
    this.editingEmail = null;
    this.editGroupId = null;
  }

  saveGroup(u: any) {
    const payload = {
      id: u.id,
      userName: u.username,
      email: u.email,
      password: u.password || '',
      role: u.role,
      status: u.status,
      addresses: u.addresses || [],
      customerGroupId: this.editGroupId
    };
    this.http.put(`${environment.apiUrl}/api/users/${u.email}`, payload).subscribe({
      next: () => {
        const group = this.customerGroups.find(g => g.id === this.editGroupId);
        u.groupName = group?.groupName || '';
        u.customerGroupId = this.editGroupId;
        this.editingEmail = null;
        this.editGroupId = null;
        this.showToast('Group updated successfully');
      },
      error: () => this.showToast('Failed to update group')
    });
  }

  showToast(msg: string) {
    this.toast = msg;
    setTimeout(() => this.toast = '', 3000);
  }

  refresh(event?: Event) {
    if (event) event.stopPropagation();
    this.searchText = '';
    this.loadUsers();
  }
}
