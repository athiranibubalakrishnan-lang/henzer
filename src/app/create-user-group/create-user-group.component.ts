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
  gstPercentage     = '';
  commissionPercentage = '';
  discount          = '';
  pricingFormula    = '';
  loading = false;
  toast = '';
  toastType = '';

  constructor(private http: HttpClient, private router: Router) {}

  showToast(msg: string, type: 'success' | 'error' = 'success') {
    this.toast = msg;
    this.toastType = type;
    setTimeout(() => this.toast = '', 3000);
  }

  /** Format field to 2 decimal places on blur */
  formatField(field: 'gstPercentage' | 'commissionPercentage' | 'discount') {
    const raw = parseFloat((this as any)[field]);
    (this as any)[field] = isNaN(raw) ? '0.00' : raw.toFixed(2);
  }

  submit() {
    if (!this.groupName.trim()) {
      this.showToast('Group name is required', 'error');
      return;
    }
    this.loading = true;
    const payload = {
      groupName:            this.groupName,
      gstPercentage:        parseFloat(this.gstPercentage)        || 0,
      commissionPercentage: parseFloat(this.commissionPercentage) || 0,
      discount:             parseFloat(this.discount)             || 0,
      pricingFormula:       this.pricingFormula
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
