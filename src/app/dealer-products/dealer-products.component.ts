import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProductManagementService } from '../services/product-management.service';
import { environment } from '../../environments/environment';

export interface DealerProductRow {
  productId:       number;
  productCode:     string;
  productName:     string;
  brand:           string;
  category:        string;
  sku:             string;
  supplierPrice:   number;
  dealerPrice:     number | null;
  proposedPrice:   number | null;
  dealerProductId: number;
  editing:         boolean;
  saving:          boolean;
}

@Component({
  selector: 'app-dealer-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dealer-products.component.html',
  styleUrls: ['./dealer-products.component.css']
})
export class DealerProductsComponent implements OnInit {

  activeTab: 'assigned' | 'approved' | 'rejected' = 'assigned';

  assigned: DealerProductRow[] = [];
  approved: DealerProductRow[] = [];
  rejected: DealerProductRow[] = [];

  loading = false;
  toast = '';
  toastType: 'success' | 'error' = 'success';

  searchAssigned = '';
  searchApproved = '';
  searchRejected = '';

  constructor(
    private http: HttpClient,
    private productMgmt: ProductManagementService,
    private zone: NgZone
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  get dealerId(): number {
    const id = localStorage.getItem('dealerId');
    if (!id) console.warn('dealerId not found in localStorage');
    return Number(id || 0);
  }

  showToast(msg: string, type: 'success' | 'error' = 'success') {
    this.toast     = msg;
    this.toastType = type;
    setTimeout(() => this.toast = '', 3000);
  }

  loadProducts() {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/api/products/pending`).subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.loading = false;
          const raw = Array.isArray(data) ? data : [];
          const myId = this.dealerId;

          const assignedList: DealerProductRow[] = [];
          const approvedList: DealerProductRow[] = [];
          const rejectedList: DealerProductRow[] = [];

          raw.forEach(p => {
            const dealers: any[] = p.dealerProducts ?? [];
            // Find the entry that belongs to this dealer
            const myEntry = dealers.find((d: any) => d.dealerId === myId);
            if (!myEntry) return; // product not assigned to this dealer — skip

            const row: DealerProductRow = {
              productId:      p.id,
              productCode:    p.productCode,
              productName:    p.productName,
              brand:          p.brand,
              category:       p.category,
              sku:            p.sku,
              supplierPrice:  p.supplierPrice ?? 0,
              dealerPrice:    myEntry.dealerPrice ?? null,
              proposedPrice:  myEntry.dealerPrice ?? null,
              dealerProductId: myEntry.id,
              editing:        false,
              saving:         false
            };

            const status: string | null = myEntry.status ?? null;
            if (status === 'APPROVED') {
              approvedList.push(row);
            } else if (status === 'REJECTED') {
              rejectedList.push(row);
            } else {
              // null status → assigned but not yet actioned
              assignedList.push(row);
            }
          });

          this.assigned = assignedList;
          this.approved = approvedList;
          this.rejected = rejectedList;
        });
      },
      error: () => {
        this.zone.run(() => {
          this.loading = false;
          this.showToast('Failed to load products', 'error');
        });
      }
    });
  }

  // ── Filtered lists ────────────────────────────────────────────────

  get filteredAssigned(): DealerProductRow[] {
    const q = this.searchAssigned.toLowerCase();
    return q ? this.assigned.filter(r => this.matches(r, q)) : this.assigned;
  }

  get filteredApproved(): DealerProductRow[] {
    const q = this.searchApproved.toLowerCase();
    return q ? this.approved.filter(r => this.matches(r, q)) : this.approved;
  }

  get filteredRejected(): DealerProductRow[] {
    const q = this.searchRejected.toLowerCase();
    return q ? this.rejected.filter(r => this.matches(r, q)) : this.rejected;
  }

  private matches(r: DealerProductRow, q: string): boolean {
    return r.productName?.toLowerCase().includes(q) ||
           r.sku?.toLowerCase().includes(q) ||
           r.category?.toLowerCase().includes(q) ||
           r.brand?.toLowerCase().includes(q);
  }

  // ── Counts ────────────────────────────────────────────────────────

  get assignedCount(): number { return this.assigned.length; }
  get approvedCount(): number { return this.approved.length; }
  get rejectedCount(): number { return this.rejected.length; }

  // ── Price editing ─────────────────────────────────────────────────

  startEdit(row: DealerProductRow)  { row.editing = true; }
  cancelEdit(row: DealerProductRow) { row.editing = false; }

  savePrice(row: DealerProductRow) {
    if (row.proposedPrice === null || row.proposedPrice === undefined) {
      this.showToast('Please enter a price', 'error');
      return;
    }
    row.saving = true;
    this.productMgmt.updatePrice(this.dealerId, row.productId, row.proposedPrice).subscribe({
      next: () => {
        this.zone.run(() => {
          row.saving  = false;
          row.editing = false;
          this.showToast(`Price submitted for ${row.productName}`, 'success');
        });
      },
      error: () => {
        this.zone.run(() => {
          row.saving = false;
          this.showToast('Failed to submit price', 'error');
        });
      }
    });
  }
}
