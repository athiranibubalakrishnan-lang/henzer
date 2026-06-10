import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

  activeTab: 'dealers' | 'group-users' | 'regular-users' = 'dealers';

  allUsers: any[] = [];
  loading = false;
  toast = '';

  searchDealers = '';
  searchGroupUsers = '';
  searchRegularUsers = '';
  customerGroups: any[] = [];
  selectedGroupId: number | null = null;

  editingEmail: string | null = null;
  editGroupId: number | null = null;

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadCustomerGroups();
  }

  loadCustomerGroups() {
    this.http.get<any[]>(`${environment.apiUrl}/api/customer-groups`).subscribe({
      next: (data) => {
        this.customerGroups = Array.isArray(data) ? data : [];
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  loadUsers() {
    this.loading = true;
    this.userService.getAll().subscribe({
      next: (data) => {
        this.loading = false;
        this.allUsers = Array.isArray(data) ? data : [];
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load users', err);
        this.cdr.markForCheck();
      }
    });
  }

  get dealers(): any[] {
    const q = this.searchDealers.toLowerCase();
    return this.allUsers
      .filter(u => u.role === 'DEALER')
      .filter(u => !q ||
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q));
  }

  get groupUsers(): any[] {
    const q = this.searchGroupUsers.toLowerCase();
    return this.allUsers
      .filter(u => u.role === 'USER' && !!u.customerGroupId)
      .filter(u => !this.selectedGroupId || u.customerGroupId === this.selectedGroupId)
      .filter(u => !q ||
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.groupName?.toLowerCase().includes(q));
  }

  get regularUsers(): any[] {
    const q = this.searchRegularUsers.toLowerCase();
    return this.allUsers
      .filter(u => u.role === 'USER' && !u.customerGroupId)
      .filter(u => !q ||
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q));
  }

  groupNameFor(groupId: number): string {
    return this.customerGroups.find(g => g.id === groupId)?.groupName ?? '—';
  }

  startEditGroup(u: any) {
    this.editingEmail = u.email;
    this.editGroupId  = u.customerGroupId || null;
  }

  cancelEditGroup() {
    this.editingEmail = null;
    this.editGroupId  = null;
  }

  saveGroup(u: any) {
    const payload = {
      id:              u.id,
      userName:        u.username,
      email:           u.email,
      role:            u.role,
      status:          u.status,
      addresses:       u.addresses || [],
      customerGroupId: this.editGroupId
    };
    this.http.put(`${environment.apiUrl}/api/users/${u.email}`, payload).subscribe({
      next: () => {
        const group = this.customerGroups.find(g => g.id === this.editGroupId);
        u.groupName       = group?.groupName || '';
        u.customerGroupId = this.editGroupId || null;
        this.editingEmail = null;
        this.editGroupId  = null;
        // If a group was assigned, switch to group-users tab so the user appears there
        if (u.customerGroupId) {
          this.activeTab = 'group-users';
        }
        this.showToast('Group updated successfully');
        this.cdr.markForCheck();
      },
      error: () => this.showToast('Failed to update group')
    });
  }

  showToast(msg: string) {
    this.toast = msg;
    setTimeout(() => this.toast = '', 3000);
  }

  refresh() {
    this.searchDealers      = '';
    this.searchGroupUsers   = '';
    this.searchRegularUsers = '';
    this.loadUsers();
  }

  get dealerCount(): number       { return this.allUsers.filter(u => u.role === 'DEALER').length; }
  get groupUserCount(): number    { return this.allUsers.filter(u => u.role === 'USER' && !!u.customerGroupId).length; }
  get regularUserCount(): number  { return this.allUsers.filter(u => u.role === 'USER' && !u.customerGroupId).length; }
}
