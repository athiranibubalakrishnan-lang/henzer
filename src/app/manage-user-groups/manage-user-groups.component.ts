import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface CustomerGroup {
  id: number;
  groupName: string;
  gstPercentage?: number;
  commissionPercentage?: number;
  discount?: number;
  pricingFormula?: string;
}

@Component({
  selector: 'app-manage-user-groups',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-user-groups.component.html',
  styleUrls: ['./manage-user-groups.component.css']
})
export class ManageUserGroupsComponent implements OnInit {
  groups: CustomerGroup[] = [];
  loading = false;
  toast = '';
  toastType = '';
  editingId: number | null = null;
  editData: Partial<CustomerGroup> = {};

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() { this.loadGroups(); }

  showToast(msg: string, type: 'success' | 'error' = 'success') {
    this.toast = msg;
    this.toastType = type;
    setTimeout(() => this.toast = '', 3000);
  }

  loadGroups() {
    this.loading = true;
    this.http.get<CustomerGroup[]>(`${environment.apiUrl}/api/customer-groups`).subscribe({
      next: (data) => { this.loading = false; this.groups = Array.isArray(data) ? data : []; },
      error: () => { this.loading = false; this.showToast('Failed to load customer groups', 'error'); }
    });
  }

  createNew() {
    this.router.navigate(['/create-user-group']);
  }

  startEdit(g: CustomerGroup) {
    this.editingId = g.id;
    this.editData = { ...g };
  }

  cancelEdit() {
    this.editingId = null;
    this.editData = {};
  }

  saveEdit(g: CustomerGroup) {
    this.http.put(`${environment.apiUrl}/api/customer-groups/${g.id}`, this.editData).subscribe({
      next: () => {
        this.editingId = null;
        this.editData = {};
        this.showToast('Group updated successfully');
        this.loadGroups();
      },
      error: () => this.showToast('Failed to update group', 'error')
    });
  }

  delete(g: CustomerGroup) {
    if (!confirm(`Delete group "${g.groupName}"?`)) return;
    this.http.delete(`${environment.apiUrl}/api/customer-groups/${g.id}`).subscribe({
      next: () => {
        this.showToast('Group deleted successfully');
        this.loadGroups();
      },
      error: () => this.showToast('Failed to delete group', 'error')
    });
  }
}
