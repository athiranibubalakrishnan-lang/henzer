import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface PricingConfig {
  id?: number;
  commissionPercentage: number;
  description: string;
}

@Component({
  selector: 'app-pricing-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pricing-config.component.html',
  styleUrls: ['./pricing-config.component.css']
})
export class PricingConfigComponent implements OnInit {

  config: PricingConfig | null = null;
  loading    = false;
  saving     = false;
  deleting   = false;
  error      = '';
  toast      = '';
  toastType: 'success' | 'error' = 'success';

  editPercentage  = 0;
  editDescription = '';
  isEditing       = false;
  isCreating      = false;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.loadConfig(); }

  showToast(msg: string, type: 'success' | 'error' = 'success') {
    this.toast     = msg;
    this.toastType = type;
    setTimeout(() => this.toast = '', 3000);
  }

  loadConfig() {
    this.loading = true;
    this.error   = '';
    this.http.get<any>(`${environment.apiUrl}/api/pricing-config`).subscribe({
      next: (data) => {
        this.loading = false;
        this.config = Array.isArray(data) ? data[0] ?? null : data;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        if (err?.status === 404) {
          this.config = null;
        } else {
          this.error = `Failed to load pricing config (${err?.status ?? 'error'})`;
        }
        this.cdr.markForCheck();
      }
    });
  }

  startCreate() {
    this.editPercentage  = 0;
    this.editDescription = '';
    this.isCreating = true;
    this.isEditing  = false;
  }

  startEdit() {
    if (!this.config) return;
    this.editPercentage  = this.config.commissionPercentage;
    this.editDescription = this.config.description;
    this.isEditing  = true;
    this.isCreating = false;
  }

  cancel() {
    this.isEditing  = false;
    this.isCreating = false;
  }

  save() {
    if (this.editPercentage < 0 || this.editPercentage > 100) {
      this.showToast('Commission must be between 0 and 100', 'error');
      return;
    }
    const body = {
      commissionPercentage: this.editPercentage,
      description:          this.editDescription
    };
    this.saving = true;

    if (this.isCreating) {
      this.http.post<any>(`${environment.apiUrl}/api/pricing-config`, body).subscribe({
        next: (data) => {
          this.saving     = false;
          this.isCreating = false;
          this.config     = data;
          this.showToast('Commission config created successfully', 'success');
          this.cdr.markForCheck();
        },
        error: () => {
          this.saving = false;
          this.showToast('Failed to create config', 'error');
          this.cdr.markForCheck();
        }
      });
    } else {
      this.http.put<any>(`${environment.apiUrl}/api/pricing-config/${this.config!.id}`, body).subscribe({
        next: (data) => {
          this.saving    = false;
          this.isEditing = false;
          this.config    = data;
          this.showToast('Commission config updated successfully', 'success');
          this.cdr.markForCheck();
        },
        error: () => {
          this.saving = false;
          this.showToast('Failed to update config', 'error');
          this.cdr.markForCheck();
        }
      });
    }
  }

  deleteConfig() {
    if (!this.config?.id) return;
    if (!confirm('Delete the global commission config?')) return;
    this.deleting = true;
    this.http.delete(`${environment.apiUrl}/api/pricing-config/${this.config.id}`,
      { responseType: 'text' }
    ).subscribe({
      next: () => {
        this.deleting = false;
        this.config   = null;
        this.showToast('Commission config deleted', 'success');
        this.cdr.markForCheck();
      },
      error: () => {
        this.deleting = false;
        this.showToast('Failed to delete config', 'error');
        this.cdr.markForCheck();
      }
    });
  }
}
