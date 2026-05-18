import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface DealerProduct {
  id: number;
  dealerId: number;
  dealerCode: string;
  dealerName: string;
  dealerPrice: number | null;
  processing: boolean;
  status?: string;
}

export interface ProductCard {
  id: number;
  productCode: string;
  productName: string;
  brand: string;
  category: string;
  sku: string;
  supplierPrice: number;
  status: string;
  dealerProducts: DealerProduct[];
  expanded: boolean;
  processing: boolean;
}

@Component({
  selector: 'app-product-approval',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-approval.component.html',
  styleUrls: ['./product-approval.component.css']
})
export class ProductApprovalComponent implements OnInit {

  activeTab: 'pending' | 'approved' | 'rejected' = 'pending';

  pending:  ProductCard[] = [];
  approved: ProductCard[] = [];
  rejected: ProductCard[] = [];

  pendingLoading  = false;
  approvedLoading = false;

  searchPending  = '';
  searchApproved = '';
  searchRejected = '';
  brandFilter    = '';
  categoryFilter = '';

  // Pagination
  pagePending  = 1;
  pageApproved = 1;
  pageRejected = 1;
  readonly PAGE_SIZE = 10;

  toast     = '';
  toastType: 'success' | 'error' = 'success';

  constructor(private http: HttpClient, private zone: NgZone) {}

  ngOnInit() { this.loadAll(); }

  showToast(msg: string, type: 'success' | 'error' = 'success') {
    this.toast     = msg;
    this.toastType = type;
    setTimeout(() => this.toast = '', 3000);
  }

  loadAll() { this.loadPending(); }

  // ── Data loading ──────────────────────────────────────────────────

  loadPending() {
    this.pendingLoading  = true;
    this.approvedLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/api/products/pending`).subscribe({
      next: (data) => this.zone.run(() => {
        this.pendingLoading = false;
        const raw = Array.isArray(data) ? data : [];

        const approvedFromPending: ProductCard[] = [];
        const rejectedFromPending: ProductCard[] = [];
        const pendingCards:        ProductCard[] = [];

        raw.forEach(p => {
          const dealers: any[] = p.dealerProducts ?? [];

          const approvedDealers = dealers.filter((d: any) => d.status === 'APPROVED');
          const rejectedDealers = dealers.filter((d: any) => d.status === 'REJECTED');
          // Pending dealers: empty array OR dealers with null status
          const pendingDealers  = dealers.filter((d: any) => d.status == null);

          // Products with APPROVED dealers → Approved tab
          if (approvedDealers.length > 0) {
            approvedFromPending.push({ ...this.mapCard(p, approvedDealers), status: 'APPROVED' });
          }

          // Products with REJECTED dealers → Rejected tab
          if (rejectedDealers.length > 0) {
            rejectedFromPending.push({ ...this.mapCard(p, rejectedDealers), status: 'REJECTED' });
          }

          // Pending tab:
          //   - dealerProducts is empty (no dealers assigned yet) → PENDING
          //   - has dealers but all statuses are null (assigned, not yet actioned) → ASSIGNED
          //   - has some pending (null-status) dealers alongside actioned ones → show only pending dealers
          const hasPendingDealers = dealers.length === 0 || pendingDealers.length > 0;
          if (hasPendingDealers) {
            const derivedStatus = dealers.length === 0 ? 'PENDING' : 'ASSIGNED';
            pendingCards.push({
              ...this.mapCard(p, pendingDealers),
              status: derivedStatus
            });
          }
        });

        this.pending  = pendingCards;
        this.rejected = rejectedFromPending;

        // Load approved from API and merge with those derived from pending response
        this.http.get<any[]>(`${environment.apiUrl}/api/products/approved`).subscribe({
          next: (approvedData) => this.zone.run(() => {
            this.approvedLoading = false;
            const fromApi = this.mapCards(Array.isArray(approvedData) ? approvedData : []);
            const merged  = [...fromApi];
            approvedFromPending.forEach(card => {
              if (!merged.find(a => a.productCode === card.productCode)) {
                merged.push(card);
              }
            });
            this.approved = merged;
          }),
          error: () => this.zone.run(() => {
            this.approvedLoading = false;
            this.approved = approvedFromPending;
            this.showToast('Failed to load approved products', 'error');
          })
        });
      }),
      error: () => this.zone.run(() => {
        this.pendingLoading  = false;
        this.approvedLoading = false;
        this.showToast('Failed to load pending products', 'error');
        this.loadApproved();
      })
    });
  }

  loadApproved() {
    this.approvedLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/api/products/approved`).subscribe({
      next: (data) => this.zone.run(() => {
        this.approvedLoading = false;
        this.approved = this.mapCards(Array.isArray(data) ? data : []);
      }),
      error: () => this.zone.run(() => {
        this.approvedLoading = false;
        this.showToast('Failed to load approved products', 'error');
      })
    });
  }

  // ── Mappers ───────────────────────────────────────────────────────

  private mapCards(data: any[]): ProductCard[] {
    return data.map(p => this.mapCard(p, p.dealerProducts ?? []));
  }

  private mapCard(p: any, dealerProducts: any[]): ProductCard {
    return {
      id:            p.id,
      productCode:   p.productCode,
      productName:   p.productName,
      brand:         p.brand,
      category:      p.category,
      sku:           p.sku,
      supplierPrice: p.supplierPrice ?? 0,
      status:        p.status,
      expanded:      false,
      processing:    false,
      dealerProducts: dealerProducts.map((d: any) => this.mapDealer(d))
    };
  }

  private mapDealer(d: any): DealerProduct {
    return {
      id:          d.id,
      dealerId:    d.dealerId,
      dealerCode:  d.dealerCode,
      dealerName:  d.dealerName,
      dealerPrice: d.dealerPrice ?? null,
      processing:  false,
      status:      d.status ?? undefined
    };
  }

  // ── Filtered lists ────────────────────────────────────────────────

  get filteredPending(): ProductCard[] {
    return this.applyFilters(this.pending, this.searchPending);
  }

  get filteredApproved(): ProductCard[] {
    return this.applyFilters(this.approved, this.searchApproved);
  }

  get filteredRejected(): ProductCard[] {
    return this.applyFilters(this.rejected, this.searchRejected);
  }

  private applyFilters(list: ProductCard[], search: string): ProductCard[] {
    let result = list;
    if (this.brandFilter) {
      const b = this.brandFilter.toLowerCase();
      result = result.filter(p => p.brand?.toLowerCase().includes(b));
    }
    if (this.categoryFilter) {
      const c = this.categoryFilter.toLowerCase();
      result = result.filter(p => p.category?.toLowerCase().includes(c));
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => this.matchesSearch(p, q));
    }
    return result;
  }

  private matchesSearch(p: ProductCard, q: string): boolean {
    return p.productName?.toLowerCase().includes(q) ||
           p.sku?.toLowerCase().includes(q) ||
           p.category?.toLowerCase().includes(q) ||
           p.brand?.toLowerCase().includes(q);
  }

  get uniqueBrands(): string[] {
    const all = [...this.pending, ...this.approved, ...this.rejected];
    return [...new Set(all.map(p => p.brand).filter(Boolean))].sort();
  }

  // ── Pagination ────────────────────────────────────────────────────

  paginate<T>(list: T[], page: number): T[] {
    const start = (page - 1) * this.PAGE_SIZE;
    return list.slice(start, start + this.PAGE_SIZE);
  }

  totalPages(total: number): number {
    return Math.max(1, Math.ceil(total / this.PAGE_SIZE));
  }

  pageNumbers(total: number): number[] {
    return Array.from({ length: this.totalPages(total) }, (_, i) => i + 1);
  }

  get pagedPending():  ProductCard[] { return this.paginate(this.filteredPending,  this.pagePending);  }
  get pagedApproved(): ProductCard[] { return this.paginate(this.filteredApproved, this.pageApproved); }
  get pagedRejected(): ProductCard[] { return this.paginate(this.filteredRejected, this.pageRejected); }

  toggle(card: ProductCard) { card.expanded = !card.expanded; }

  // ── Product-level approve / reject ────────────────────────────────

  approveProduct(card: ProductCard) {
    card.processing = true;
    this.http.put(
      `${environment.apiUrl}/api/products/${card.productCode}/approve`, {},
      { responseType: 'text' as 'json' }
    ).subscribe({
      next: () => this.zone.run(() => {
        card.processing = false;
        card.status     = 'APPROVED';
        this.pending    = this.pending.filter(p => p.productCode !== card.productCode);
        this.approved   = [{ ...card, status: 'APPROVED' }, ...this.approved];
        this.showToast(`"${card.productName}" approved`, 'success');
      }),
      error: () => this.zone.run(() => {
        card.processing = false;
        this.showToast(`Failed to approve "${card.productName}"`, 'error');
      })
    });
  }

  rejectProduct(card: ProductCard) {
    card.processing = true;
    this.http.put(
      `${environment.apiUrl}/api/products/${card.productCode}/reject`, {},
      { responseType: 'text' as 'json' }
    ).subscribe({
      next: () => this.zone.run(() => {
        card.processing = false;
        card.status     = 'REJECTED';
        this.pending    = this.pending.filter(p => p.productCode !== card.productCode);
        this.rejected   = [{ ...card, status: 'REJECTED' }, ...this.rejected];
        this.showToast(`"${card.productName}" rejected`, 'success');
      }),
      error: () => this.zone.run(() => {
        card.processing = false;
        this.showToast(`Failed to reject "${card.productName}"`, 'error');
      })
    });
  }

  // ── Dealer-level approve / reject ─────────────────────────────────

  approveDealer(card: ProductCard, dealer: DealerProduct) {
    dealer.processing = true;
    this.http.put(
      `${environment.apiUrl}/api/products/${card.productCode}/approve`, {},
      { params: { dealerId: dealer.dealerId }, responseType: 'text' as 'json' }
    ).subscribe({
      next: () => this.zone.run(() => {
        dealer.processing = false;
        dealer.status     = 'APPROVED';

        // Remove dealer from pending card
        card.dealerProducts = card.dealerProducts.filter(d => d.id !== dealer.id);

        // Add to approved tab
        const approvedCard = this.approved.find(a => a.productCode === card.productCode);
        if (approvedCard) {
          approvedCard.dealerProducts.push({ ...dealer, status: 'APPROVED' });
        } else {
          this.approved = [
            { ...card, dealerProducts: [{ ...dealer, status: 'APPROVED' }], status: 'APPROVED', expanded: false },
            ...this.approved
          ];
        }
        this.showToast(`Approved for ${dealer.dealerName}`, 'success');
      }),
      error: () => this.zone.run(() => {
        dealer.processing = false;
        this.showToast(`Failed to approve for ${dealer.dealerName}`, 'error');
      })
    });
  }

  rejectDealer(card: ProductCard, dealer: DealerProduct) {
    dealer.processing = true;
    this.http.put(
      `${environment.apiUrl}/api/products/${card.productCode}/reject`, {},
      { params: { dealerId: dealer.dealerId }, responseType: 'text' as 'json' }
    ).subscribe({
      next: () => this.zone.run(() => {
        dealer.processing = false;
        dealer.status     = 'REJECTED';

        // Remove dealer from pending card
        card.dealerProducts = card.dealerProducts.filter(d => d.id !== dealer.id);

        // Add to rejected tab
        const rejectedCard = this.rejected.find(r => r.productCode === card.productCode);
        if (rejectedCard) {
          rejectedCard.dealerProducts.push({ ...dealer, status: 'REJECTED' });
        } else {
          this.rejected = [
            { ...card, dealerProducts: [{ ...dealer, status: 'REJECTED' }], status: 'REJECTED', expanded: false },
            ...this.rejected
          ];
        }
        this.showToast(`Rejected for ${dealer.dealerName}`, 'success');
      }),
      error: () => this.zone.run(() => {
        dealer.processing = false;
        this.showToast(`Failed to reject for ${dealer.dealerName}`, 'error');
      })
    });
  }

  get pendingCount():  number { return this.pending.length; }
  get approvedCount(): number { return this.approved.length; }
  get rejectedCount(): number { return this.rejected.length; }
}
