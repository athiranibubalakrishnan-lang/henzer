import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-create-user-group',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-user-group.component.html',
  styleUrls: ['./create-user-group.component.css']
})
export class CreateUserGroupComponent {
  groupName = '';
  gstPercentage: number | null = null;
  commissionPercentage: number | null = null;
  discount: number | null = null;
  pricingFormula = '';
  loading = false;
  toast = '';
  toastType = '';

  constructor(private http: HttpClient, private router: Router) {}

  showToast(msg: string, type: 'success' | 'error' = 'success') {
    this.toast = msg;
    this.toastType = type;
    setTimeout(() => this.toast = '', 3000);
  }

  submit() {
    if (!this.groupName.trim()) {
      this.showToast('Group name is required', 'error');
      return;
    }
    this.loading = true;
    const payload = {
      groupName: this.groupName,
      gstPercentage: this.gstPercentage,
      commissionPercentage: this.commissionPercentage,
      discount: this.discount,
      pricingFormula: this.pricingFormula
    };
    this.http.post(`${environment.apiUrl}/api/customer-groups`, payload).subscribe({
      next: () => {
        this.loading = false;
        this.showToast('Customer group created successfully');
        setTimeout(() => this.router.navigate(['/manage-user-groups']), 1500);
      },
      error: () => {
        this.loading = false;
        this.showToast('Failed to create customer group', 'error');
      }
    });
  }

  cancel() {
    this.router.navigate(['/manage-user-groups']);
  }
}
