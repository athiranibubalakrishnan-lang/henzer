import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ProductManagementService } from '../services/product-management.service';

export interface DealerProduct {
  id: number;
  dealerId: number;
  dealerCode: string;
  dealerName: string;
  dealerPrice: number | null;
  editingPrice: number | null;  // admin's in-progress edit
  editing: boolean;
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
  categoryBrands: string[] = [];  // brands loaded from API based on selected category

  // Pagination
  pagePending  = 1;
  pageApproved = 1;
  pageRejected = 1;
  readonly PAGE_SIZE = 10;

  // Bulk selection (pending tab) — tracks {productId, dealerId} pairs
  selectedItems: Set<string> = new Set(); // key = "productId:dealerId"
  bulkProcessing = false;

  toast     = '';
  toastType: 'success' | 'error' = 'success';

  constructor(private http: HttpClient, private zone: NgZone, private productMgmt: ProductManagementService) {}

  ngOnInit() { this.loadAll(); }

  onCategoryChange() {
    this.brandFilter = '';
    this.pagePending  = 1;
    this.pageApproved = 1;
    this.pageRejected = 1;
    this.categoryBrands = [];
    if (this.categoryFilter) {
      this.http.get<any[]>(`${environment.apiUrl}/api/products/category/${this.categoryFilter}`).subscribe({
        next: (data) => {
          if (!Array.isArray(data) || data.length === 0) { this.categoryBrands = []; return; }
          // Handle both string[] and product object[] responses
          this.categoryBrands = typeof data[0] === 'string'
            ? [...new Set(data.filter(Boolean))].sort() as string[]
            : [...new Set(data.map((p: any) => p.brand).filter(Boolean))].sort() as string[];
        },
        error: () => {}
      });
    }
  }

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
    // Read price from all possible field names the backend might return
    const price = d.dealerPrice ?? d.price ?? d.assignedPrice ?? d.proposedPrice ?? null;
    return {
      id:           d.id,
      dealerId:     d.dealerId,
      dealerCode:   d.dealerCode,
      dealerName:   d.dealerName,
      dealerPrice:  price,
      editingPrice: price,
      editing:      false,
      processing:   false,
      status:       d.status ?? undefined
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
    const body = [{ productId: card.id, dealerId: null }];
    this.http.put(`${environment.apiUrl}/api/products/approve`, body,
      { responseType: 'text' as 'json' }
    ).subscribe({
      next: (res: any) => this.zone.run(() => {
        card.processing = false;
        card.status     = 'APPROVED';
        this.pending    = this.pending.filter(p => p.productCode !== card.productCode);
        this.approved   = [{ ...card, status: 'APPROVED' }, ...this.approved];
        this.showToast(res || 'Product(s) approved by admin', 'success');
      }),
      error: () => this.zone.run(() => {
        card.processing = false;
        this.showToast(`Failed to approve "${card.productName}"`, 'error');
      })
    });
  }

  rejectProduct(card: ProductCard) {
    card.processing = true;
    const body = [{ productId: card.id, dealerId: null }];
    this.http.put(`${environment.apiUrl}/api/products/reject`, body,
      { responseType: 'text' as 'json' }
    ).subscribe({
      next: (res: any) => this.zone.run(() => {
        card.processing = false;
        card.status     = 'REJECTED';
        this.pending    = this.pending.filter(p => p.productCode !== card.productCode);
        this.rejected   = [{ ...card, status: 'REJECTED' }, ...this.rejected];
        this.showToast(res || 'Product(s) rejected by admin', 'success');
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
    // Step 1: FINALIZE_PRICE (no price needed)
    this.productMgmt.finalizePrice(dealer.dealerId, card.id).subscribe({
      next: () => {
        // Step 2: approve
        const body = [{ productId: card.id, dealerId: dealer.dealerId }];
        this.http.put(`${environment.apiUrl}/api/products/approve`, body,
          { responseType: 'text' as 'json' }
        ).subscribe({
          next: (res: any) => this.zone.run(() => {
            dealer.processing = false;
            dealer.status     = 'APPROVED';
            card.dealerProducts = card.dealerProducts.filter(d => d.id !== dealer.id);
            const approvedCard = this.approved.find(a => a.productCode === card.productCode);
            if (approvedCard) {
              approvedCard.dealerProducts.push({ ...dealer, status: 'APPROVED' });
            } else {
              this.approved = [
                { ...card, dealerProducts: [{ ...dealer, status: 'APPROVED' }], status: 'APPROVED', expanded: false },
                ...this.approved
              ];
            }
            this.showToast(res || 'Product(s) approved by admin', 'success');
          }),
          error: () => this.zone.run(() => {
            dealer.processing = false;
            this.showToast(`Failed to approve for ${dealer.dealerName}`, 'error');
          })
        });
      },
      error: () => this.zone.run(() => {
        dealer.processing = false;
        this.showToast(`Failed to finalize price for ${dealer.dealerName}`, 'error');
      })
    });
  }

  rejectDealer(card: ProductCard, dealer: DealerProduct) {
    dealer.processing = true;
    const body = [{ productId: card.id, dealerId: dealer.dealerId }];
    this.http.put(`${environment.apiUrl}/api/products/reject`, body,
      { responseType: 'text' as 'json' }
    ).subscribe({
      next: (res: any) => this.zone.run(() => {
        dealer.processing = false;
        dealer.status     = 'REJECTED';
        card.dealerProducts = card.dealerProducts.filter(d => d.id !== dealer.id);
        const rejectedCard = this.rejected.find(r => r.productCode === card.productCode);
        if (rejectedCard) {
          rejectedCard.dealerProducts.push({ ...dealer, status: 'REJECTED' });
        } else {
          this.rejected = [
            { ...card, dealerProducts: [{ ...dealer, status: 'REJECTED' }], status: 'REJECTED', expanded: false },
            ...this.rejected
          ];
        }
        this.showToast(res || 'Product(s) rejected by admin', 'success');
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

  // ── Bulk selection ────────────────────────────────────────────────

  private itemKey(productId: number, dealerId: number): string {
    return `${productId}:${dealerId}`;
  }

  isItemSelected(productId: number, dealerId: number): boolean {
    return this.selectedItems.has(this.itemKey(productId, dealerId));
  }

  toggleItem(productId: number, dealerId: number) {
    const key = this.itemKey(productId, dealerId);
    if (this.selectedItems.has(key)) {
      this.selectedItems.delete(key);
    } else {
      this.selectedItems.add(key);
    }
  }

  /** All selectable dealer entries from the current filtered+paged pending list */
  private get selectablePendingItems(): { productId: number; dealerId: number }[] {
    const items: { productId: number; dealerId: number }[] = [];
    this.filteredPending.forEach(card => {
      if (card.dealerProducts.length > 0) {
        card.dealerProducts
          .filter(d => d.status !== 'APPROVED' && d.status !== 'REJECTED')
          .forEach(d => items.push({ productId: card.id, dealerId: d.dealerId }));
      } else {
        items.push({ productId: card.id, dealerId: 0 });
      }
    });
    return items;
  }

  get isAllPendingSelected(): boolean {
    const items = this.selectablePendingItems;
    return items.length > 0 && items.every(i => this.selectedItems.has(this.itemKey(i.productId, i.dealerId)));
  }

  toggleSelectAllPending() {
    const items = this.selectablePendingItems;
    if (this.isAllPendingSelected) {
      items.forEach(i => this.selectedItems.delete(this.itemKey(i.productId, i.dealerId)));
    } else {
      items.forEach(i => this.selectedItems.add(this.itemKey(i.productId, i.dealerId)));
    }
  }

  get selectedCount(): number { return this.selectedItems.size; }

  private buildBulkBody(): { productId: number; dealerId: number }[] {
    return Array.from(this.selectedItems).map(key => {
      const [productId, dealerId] = key.split(':').map(Number);
      return { productId, dealerId: dealerId || null } as any;
    });
  }

  bulkApprove() {
    if (this.selectedItems.size === 0) return;
    this.bulkProcessing = true;
    this.http.put(`${environment.apiUrl}/api/products/approve`, this.buildBulkBody(),
      { responseType: 'text' as 'json' }
    ).subscribe({
      next: (res: any) => this.zone.run(() => {
        this.bulkProcessing = false;
        this.selectedItems.clear();
        this.showToast(res || 'Product(s) approved by admin', 'success');
        this.loadAll();
      }),
      error: () => this.zone.run(() => {
        this.bulkProcessing = false;
        this.showToast('Bulk approve failed', 'error');
      })
    });
  }

  bulkReject() {
    if (this.selectedItems.size === 0) return;
    this.bulkProcessing = true;
    this.http.put(`${environment.apiUrl}/api/products/reject`, this.buildBulkBody(),
      { responseType: 'text' as 'json' }
    ).subscribe({
      next: (res: any) => this.zone.run(() => {
        this.bulkProcessing = false;
        this.selectedItems.clear();
        this.showToast(res || 'Product(s) rejected by admin', 'success');
        this.loadAll();
      }),
      error: () => this.zone.run(() => {
        this.bulkProcessing = false;
        this.showToast('Bulk reject failed', 'error');
      })
    });
  }

  // ── Admin price editing ───────────────────────────────────────────

  startEditPrice(dealer: DealerProduct) {
    dealer.editingPrice = dealer.dealerPrice;
    dealer.editing = true;
  }

  cancelEditPrice(dealer: DealerProduct) {
    dealer.editingPrice = dealer.dealerPrice;
    dealer.editing = false;
  }

  /** Admin updates dealer price then approves in one step */
  approveWithPrice(card: ProductCard, dealer: DealerProduct) {
    dealer.processing = true;
    const price = dealer.editingPrice ?? dealer.dealerPrice ?? 0;
    // Step 1: FINALIZE_PRICE (no price in this call)
    this.productMgmt.finalizePrice(dealer.dealerId, card.id).subscribe({
      next: () => {
        // Step 2: approve with price
        const body = [{ productId: card.id, dealerId: dealer.dealerId, price }];
        this.http.put(`${environment.apiUrl}/api/products/approve`, body,
          { responseType: 'text' as 'json' }
        ).subscribe({
          next: (res: any) => this.zone.run(() => {
            dealer.processing   = false;
            dealer.editing      = false;
            dealer.dealerPrice  = price;
            dealer.editingPrice = price;
            dealer.status       = 'APPROVED';
            card.dealerProducts = card.dealerProducts.filter(d => d.id !== dealer.id);
            const approvedCard = this.approved.find(a => a.productCode === card.productCode);
            if (approvedCard) {
              approvedCard.dealerProducts.push({ ...dealer, status: 'APPROVED' });
            } else {
              this.approved = [
                { ...card, dealerProducts: [{ ...dealer, status: 'APPROVED' }], status: 'APPROVED', expanded: false },
                ...this.approved
              ];
            }
            this.showToast(res || 'Product(s) approved by admin', 'success');
          }),
          error: () => this.zone.run(() => {
            dealer.processing = false;
            this.showToast(`Failed to approve for ${dealer.dealerName}`, 'error');
          })
        });
      },
      error: () => this.zone.run(() => {
        dealer.processing = false;
        this.showToast(`Failed to finalize price for ${dealer.dealerName}`, 'error');
      })
    });
  }

  /** Admin edits price on an already-approved dealer entry — calls UPDATE_PRICE */
  saveApprovedPrice(card: ProductCard, dealer: DealerProduct) {
    dealer.processing = true;
    const price = dealer.editingPrice ?? dealer.dealerPrice ?? 0;
    this.productMgmt.updatePrice(dealer.dealerId, card.id, price).subscribe({
      next: () => this.zone.run(() => {
        dealer.processing   = false;
        dealer.editing      = false;
        dealer.dealerPrice  = price;
        dealer.editingPrice = price;
        this.showToast('Price updated successfully', 'success');
      }),
      error: () => this.zone.run(() => {
        dealer.processing = false;
        this.showToast(`Failed to update price for ${dealer.dealerName}`, 'error');
      })
    });
  }
}
