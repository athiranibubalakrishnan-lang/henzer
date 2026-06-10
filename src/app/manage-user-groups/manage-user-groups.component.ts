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

  // Text-based edit fields so we can show "8.00" instead of "8"
  editGroupName = '';
  editGst = '';
  editCommission = '';
  editDiscount = '';

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
      next: (data) => {
        this.loading = false;
        this.groups = Array.isArray(data) ? data : [];
      },
      error: () => {
        this.loading = false;
        this.showToast('Failed to load customer groups', 'error');
      }
    });
  }

  createNew() {
    this.router.navigate(['/create-user-group']);
  }

  startEdit(g: CustomerGroup) {
    this.editingId = g.id;
    this.editGroupName  = g.groupName;
    this.editGst        = Math.round(g.gstPercentage ?? 0).toString();
    this.editCommission = Math.round(g.commissionPercentage ?? 0).toString();
    this.editDiscount   = Math.round(g.discount ?? 0).toString();
  }

  cancelEdit() {
    this.editingId = null;
  }

  /** On blur: reformat the text field to a whole number */
  formatField(field: 'gst' | 'commission' | 'discount') {
    const map = { gst: 'editGst', commission: 'editCommission', discount: 'editDiscount' } as const;
    const key = map[field];
    const parsed = parseFloat((this as any)[key]);
    (this as any)[key] = isNaN(parsed) ? '0' : Math.round(parsed).toString();
  }

  saveEdit(g: CustomerGroup) {
    const payload: Partial<CustomerGroup> = {
      groupName:            this.editGroupName,
      gstPercentage:        parseFloat(this.editGst)        || 0,
      commissionPercentage: parseFloat(this.editCommission) || 0,
      discount:             parseFloat(this.editDiscount)   || 0,
      pricingFormula:       g.pricingFormula
    };

    this.http.put(`${environment.apiUrl}/api/customer-groups/${g.id}`, payload, { responseType: 'text' }).subscribe({
      next: () => {
        // Update in-place — no reload needed, no double-click issue
        const idx = this.groups.findIndex(x => x.id === g.id);
        if (idx !== -1) {
          this.groups[idx] = { ...this.groups[idx], ...payload };
        }
        this.editingId = null;
        this.showToast('Group updated successfully');
      },
      error: () => this.showToast('Failed to update group', 'error')
    });
  }

  delete(g: CustomerGroup) {
    if (!confirm(`Delete group "${g.groupName}"?`)) return;
    this.http.delete(`${environment.apiUrl}/api/customer-groups/${g.id}`, { responseType: 'text' }).subscribe({
      next: () => {
        // Remove in-place — no reload, no double-click issue
        this.groups = this.groups.filter(x => x.id !== g.id);
        this.showToast('Group deleted successfully');
      },
      error: () => this.showToast('Failed to delete group', 'error')
    });
  }

  /** Format a number for display: whole number, no decimals */
  fmt(v: number | undefined | null): string {
    if (v === undefined || v === null) return '0';
    return Math.round(Number(v)).toString();
  }
}
