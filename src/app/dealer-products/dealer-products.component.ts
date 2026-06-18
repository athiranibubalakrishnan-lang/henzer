import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  priceSort: 'none' | 'asc' | 'desc' = 'none';
  constructor(
    private http: HttpClient,
    private productMgmt: ProductManagementService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  get dealerId(): number {
    const id = localStorage.getItem('dealerId');
    if (!id) console.warn('dealerId not found in localStorage');
    return Number(id || 0);
  }

  get email(): string {
    return localStorage.getItem('email') || '';
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
        this.loading = false;
        // Handle both array and single object responses
        let raw: any[];
        if (Array.isArray(data)) {
          raw = data;
        } else if (data && typeof data === 'object') {
          raw = [data];
        } else {
          raw = [];
        }
        const myId = this.dealerId;
        const myEmail = localStorage.getItem('email') || '';

        const assignedList: DealerProductRow[] = [];
        const approvedList: DealerProductRow[] = [];
        const rejectedList: DealerProductRow[] = [];

        raw.forEach(p => {
          const dealers: any[] = p.dealerProducts ?? [];
          const myId = this.dealerId;
          const myEmail = this.email;
          
          // Match by dealerId, dealerCode (email), or if no match found, 
          // show all dealer entries (API already filters for this dealer)
          let myEntry = dealers.find((d: any) => d.dealerId == myId)
            || dealers.find((d: any) => d.dealerCode === myEmail);
          
          // If no match by ID/email but there are dealer entries, take the first one
          // (the /pending API likely already returns only this dealer's products)
          if (!myEntry && dealers.length > 0) {
            myEntry = dealers[0];
          }
          if (!myEntry) return;

          const row: DealerProductRow = {
            productId:      p.id,
            productCode:    p.productCode,
            productName:    p.productName,
            brand:          p.brand,
            category:       p.category,
            sku:            p.sku,
            supplierPrice:  p.supplierPrice ?? 0,
            dealerPrice:    myEntry.dealerPrice ?? myEntry.price ?? null,
            proposedPrice:  myEntry.dealerPrice ?? myEntry.price ?? null,
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
            // null, 'PENDING', 'ASSIGNED', or any other status → assigned tab
            assignedList.push(row);
          }
        });

        this.assigned = assignedList;
        this.approved = approvedList;
        this.rejected = rejectedList;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.showToast('Failed to load products', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  get filteredAssigned(): DealerProductRow[] {
    const q = this.searchAssigned.toLowerCase();
    const list = q ? this.assigned.filter(r => this.matches(r, q)) : this.assigned;
    return this.sortByPrice(list);
  }

  get filteredApproved(): DealerProductRow[] {
    const q = this.searchApproved.toLowerCase();
    const list = q ? this.approved.filter(r => this.matches(r, q)) : this.approved;
    return this.sortByPrice(list);
  }

  get filteredRejected(): DealerProductRow[] {
    const q = this.searchRejected.toLowerCase();
    const list = q ? this.rejected.filter(r => this.matches(r, q)) : this.rejected;
    return this.sortByPrice(list);
  }

  private sortByPrice(list: DealerProductRow[]): DealerProductRow[] {
    if (this.priceSort === 'asc') return [...list].sort((a, b) => (a.supplierPrice ?? 0) - (b.supplierPrice ?? 0));
    if (this.priceSort === 'desc') return [...list].sort((a, b) => (b.supplierPrice ?? 0) - (a.supplierPrice ?? 0));
    return list;
  }

  private matches(r: DealerProductRow, q: string): boolean {
    return r.productName?.toLowerCase().includes(q) ||
           r.sku?.toLowerCase().includes(q) ||
           r.category?.toLowerCase().includes(q) ||
           r.brand?.toLowerCase().includes(q);
  }

  get assignedCount(): number { return this.assigned.length; }
  get approvedCount(): number { return this.approved.length; }
  get rejectedCount(): number { return this.rejected.length; }

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
        row.saving  = false;
        row.editing = false;
        this.showToast(`Price submitted for ${row.productName}`, 'success');
        this.cdr.markForCheck();
      },
      error: () => {
        row.saving = false;
        this.showToast('Failed to submit price', 'error');
        this.cdr.markForCheck();
      }
    });
  }
}
