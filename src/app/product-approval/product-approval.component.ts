import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { ProductManagementService } from '../services/product-management.service';

export interface DealerProduct {
  id: number;
  dealerId: number;
  dealerCode: string;
  dealerName: string;
  dealerPrice: number | null;
  editingPrice: number | null;
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
  categoryBrands: string[] = [];
  priceSort: 'none' | 'asc' | 'desc' = 'none';

  pagePending  = 1;
  pageApproved = 1;
  pageRejected = 1;
  pageSize: any = 10;
  showingAll = false;

  get PAGE_SIZE(): number {
    if (this.showingAll) return 999999;
    const val = Number(this.pageSize);
    return (!val || val < 1) ? 10 : val;
  }

  onPageSizeChange() {
    this.showingAll = false;
    this.pagePending = 1;
    this.pageApproved = 1;
    this.pageRejected = 1;
  }

  toggleShowAll() {
    this.showingAll = !this.showingAll;
    this.pagePending = 1;
    this.pageApproved = 1;
    this.pageRejected = 1;
  }

  selectedItems: Set<string> = new Set();
  bulkProcessing = false;

  toast     = '';
  toastType: 'success' | 'error' = 'success';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private productMgmt: ProductManagementService,
    private router: Router
  ) {}

  ngOnInit() {
    // Load all brands into dropdown on page init
    this.fetchBrands('');
    this.loadAll();
  }

  private fetchBrands(category: string) {
    const url = category
      ? `${environment.apiUrl}/api/products/category?category=${encodeURIComponent(category)}`
      : `${environment.apiUrl}/api/products/category`;
    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        if (!Array.isArray(data) || data.length === 0) { this.categoryBrands = []; return; }
        this.categoryBrands = typeof data[0] === 'string'
          ? [...new Set(data.filter(Boolean))].sort() as string[]
          : [...new Set(data.map((p: any) => p.brand).filter(Boolean))].sort() as string[];
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  onCategoryChange() {
    this.brandFilter = '';
    this.pagePending  = 1;
    this.pageApproved = 1;
    this.pageRejected = 1;
    this.fetchBrands(this.categoryFilter);
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
      next: (data) => {
        this.pendingLoading = false;
        const raw = Array.isArray(data) ? data : [];

        const approvedFromPending: ProductCard[] = [];
        const rejectedFromPending: ProductCard[] = [];
        const pendingCards:        ProductCard[] = [];

        raw.forEach(p => {
          const dealers: any[] = p.dealerProducts ?? [];

          const approvedDealers = dealers.filter((d: any) => d.status === 'APPROVED');
          const rejectedDealers = dealers.filter((d: any) => d.status === 'REJECTED');
          const pendingDealers  = dealers.filter((d: any) => d.status == null || d.status === '' || d.status === 'PENDING');

          if (approvedDealers.length > 0) {
            approvedFromPending.push({ ...this.mapCard(p, approvedDealers), status: 'APPROVED' });
          }

          if (rejectedDealers.length > 0) {
            rejectedFromPending.push({ ...this.mapCard(p, rejectedDealers), status: 'REJECTED' });
          }

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
        this.cdr.markForCheck();

        this.http.get<any[]>(`${environment.apiUrl}/api/products/approved`).subscribe({
          next: (approvedData) => {
            this.approvedLoading = false;
            const fromApi = this.mapCards(Array.isArray(approvedData) ? approvedData : []);
            const merged  = [...fromApi];
            approvedFromPending.forEach(card => {
              if (!merged.find(a => a.productCode === card.productCode)) {
                merged.push(card);
              }
            });
            this.approved = merged;
            this.cdr.markForCheck();
          },
          error: () => {
            this.approvedLoading = false;
            this.approved = approvedFromPending;
            this.showToast('Failed to load approved products', 'error');
            this.cdr.markForCheck();
          }
        });
      },
      error: () => {
        this.pendingLoading  = false;
        this.approvedLoading = false;
        this.showToast('Failed to load pending products', 'error');
        this.cdr.markForCheck();
        this.loadApproved();
      }
    });
  }

  loadApproved() {
    this.approvedLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/api/products/approved`).subscribe({
      next: (data) => {
        this.approvedLoading = false;
        this.approved = this.mapCards(Array.isArray(data) ? data : []);
        this.cdr.markForCheck();
      },
      error: () => {
        this.approvedLoading = false;
        this.showToast('Failed to load approved products', 'error');
        this.cdr.markForCheck();
      }
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
      result = result.filter(p => p.brand?.toLowerCase() === b);
    }
    if (this.categoryFilter) {
      const c = this.categoryFilter.toLowerCase();
      result = result.filter(p => p.category?.toLowerCase() === c);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => this.matchesSearch(p, q));
    }
    if (this.priceSort === 'asc') {
      result = [...result].sort((a, b) => (a.supplierPrice ?? 0) - (b.supplierPrice ?? 0));
    } else if (this.priceSort === 'desc') {
      result = [...result].sort((a, b) => (b.supplierPrice ?? 0) - (a.supplierPrice ?? 0));
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

  /** All unique dealer names from approved products for table columns */
  get approvedDealerNames(): string[] {
    const names = new Set<string>();
    this.filteredApproved.forEach(card => {
      card.dealerProducts.forEach(d => {
        if (d.dealerName) names.add(d.dealerName);
      });
    });
    return [...names].sort();
  }

  /** All unique dealer names from pending products for table columns */
  get pendingDealerNames(): string[] {
    const names = new Set<string>();
    this.filteredPending.forEach(card => {
      card.dealerProducts.forEach(d => {
        if (d.dealerName) names.add(d.dealerName);
      });
    });
    return [...names].sort();
  }

  /** Get dealer price for a specific product and dealer name (approved tab) */
  getDealerPriceForApproved(card: ProductCard, dealerName: string): string {
    const dealer = card.dealerProducts.find(d => d.dealerName === dealerName);
    if (!dealer) return '—';
    return dealer.dealerPrice !== null ? '¥' + dealer.dealerPrice : '—';
  }

  /** Get dealer price for a specific product and dealer name (pending tab) */
  getDealerPriceForPending(card: ProductCard, dealerName: string): string {
    const dealer = card.dealerProducts.find(d => d.dealerName === dealerName);
    if (!dealer) return '—';
    return dealer.dealerPrice !== null ? '¥' + dealer.dealerPrice : '—';
  }

  /** Get the full dealer entry for pending tab (for checkbox binding) */
  getDealerEntryForPending(card: ProductCard, dealerName: string): DealerProduct | null {
    return card.dealerProducts.find(d => d.dealerName === dealerName) || null;
  }

  /** Check if a dealer entry exists for this product */
  hasDealerEntry(card: ProductCard, dealerName: string): boolean {
    return card.dealerProducts.some(d => d.dealerName === dealerName);
  }

  /** Get dealerId for a specific dealer name in a pending card */
  getDealerIdForPending(card: ProductCard, dealerName: string): number {
    const entry = card.dealerProducts.find(d => d.dealerName === dealerName);
    return entry?.dealerId ?? 0;
  }

  // Approved tab selection
  selectedApprovedIds: Set<string> = new Set();

  isApprovedSelected(productCode: string): boolean {
    return this.selectedApprovedIds.has(productCode);
  }

  toggleApprovedSelection(productCode: string) {
    if (this.selectedApprovedIds.has(productCode)) {
      this.selectedApprovedIds.delete(productCode);
    } else {
      this.selectedApprovedIds.add(productCode);
    }
  }

  get isAllApprovedSelected(): boolean {
    const list = this.pagedApproved;
    return list.length > 0 && list.every(c => this.selectedApprovedIds.has(c.productCode));
  }

  toggleSelectAllApproved() {
    if (this.isAllApprovedSelected) {
      this.pagedApproved.forEach(c => this.selectedApprovedIds.delete(c.productCode));
    } else {
      this.pagedApproved.forEach(c => this.selectedApprovedIds.add(c.productCode));
    }
  }

  get selectedApprovedCount(): number { return this.selectedApprovedIds.size; }

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
      next: (res: any) => {
        card.processing = false;
        card.status     = 'APPROVED';
        this.pending    = this.pending.filter(p => p.productCode !== card.productCode);
        this.approved   = [{ ...card, status: 'APPROVED' }, ...this.approved];
        this.showToast(res || 'Product(s) approved by admin', 'success');
        this.cdr.markForCheck();
      },
      error: () => {
        card.processing = false;
        this.showToast(`Failed to approve "${card.productName}"`, 'error');
        this.cdr.markForCheck();
      }
    });
  }

  rejectProduct(card: ProductCard) {
    card.processing = true;
    const body = [{ productId: card.id, dealerId: null }];
    this.http.put(`${environment.apiUrl}/api/products/reject`, body,
      { responseType: 'text' as 'json' }
    ).subscribe({
      next: (res: any) => {
        card.processing = false;
        card.status     = 'REJECTED';
        this.pending    = this.pending.filter(p => p.productCode !== card.productCode);
        this.rejected   = [{ ...card, status: 'REJECTED' }, ...this.rejected];
        this.showToast(res || 'Product(s) rejected by admin', 'success');
        this.cdr.markForCheck();
      },
      error: () => {
        card.processing = false;
        this.showToast(`Failed to reject "${card.productName}"`, 'error');
        this.cdr.markForCheck();
      }
    });
  }

  // ── Dealer-level approve / reject ─────────────────────────────────

  approveDealer(card: ProductCard, dealer: DealerProduct) {
    dealer.processing = true;
    this.productMgmt.finalizePrice(dealer.dealerId, card.id).subscribe({
      next: () => {
        const body = [{ productId: card.id, dealerId: dealer.dealerId }];
        this.http.put(`${environment.apiUrl}/api/products/approve`, body,
          { responseType: 'text' as 'json' }
        ).subscribe({
          next: (res: any) => {
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
            this.cdr.markForCheck();
          },
          error: () => {
            dealer.processing = false;
            this.showToast(`Failed to approve for ${dealer.dealerName}`, 'error');
            this.cdr.markForCheck();
          }
        });
      },
      error: () => {
        dealer.processing = false;
        this.showToast(`Failed to finalize price for ${dealer.dealerName}`, 'error');
        this.cdr.markForCheck();
      }
    });
  }

  rejectDealer(card: ProductCard, dealer: DealerProduct) {
    dealer.processing = true;
    const body = [{ productId: card.id, dealerId: dealer.dealerId }];
    this.http.put(`${environment.apiUrl}/api/products/reject`, body,
      { responseType: 'text' as 'json' }
    ).subscribe({
      next: (res: any) => {
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
        this.cdr.markForCheck();
      },
      error: () => {
        dealer.processing = false;
        this.showToast(`Failed to reject for ${dealer.dealerName}`, 'error');
        this.cdr.markForCheck();
      }
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
      // Remove any other dealer selection for the same product
      Array.from(this.selectedItems).forEach(k => {
        if (k.startsWith(`${productId}:`)) {
          this.selectedItems.delete(k);
        }
      });
      this.selectedItems.add(key);
    }
  }

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
      next: (res: any) => {
        this.bulkProcessing = false;
        this.selectedItems.clear();
        this.showToast(res || 'Product(s) approved by admin', 'success');
        this.cdr.markForCheck();
        this.loadAll();
      },
      error: () => {
        this.bulkProcessing = false;
        this.showToast('Bulk approve failed', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  bulkReject() {
    if (this.selectedItems.size === 0) return;
    this.bulkProcessing = true;
    this.http.put(`${environment.apiUrl}/api/products/reject`, this.buildBulkBody(),
      { responseType: 'text' as 'json' }
    ).subscribe({
      next: (res: any) => {
        this.bulkProcessing = false;
        this.selectedItems.clear();
        this.showToast(res || 'Product(s) rejected by admin', 'success');
        this.cdr.markForCheck();
        this.loadAll();
      },
      error: () => {
        this.bulkProcessing = false;
        this.showToast('Bulk reject failed', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  // ── Admin price editing ───────────────────────────────────────────

  viewPriceHistory(card: ProductCard, dealer: DealerProduct) {
    this.router.navigate(
      ['/price-history', dealer.dealerId, card.id],
      { queryParams: { dealerName: dealer.dealerName, productName: card.productName } }
    );
  }

  startEditPrice(dealer: DealerProduct) {
    dealer.editingPrice = dealer.dealerPrice;
    dealer.editing = true;
  }

  cancelEditPrice(dealer: DealerProduct) {
    dealer.editingPrice = dealer.dealerPrice;
    dealer.editing = false;
  }

  savePendingPrice(card: ProductCard, dealer: DealerProduct) {
    if (!dealer.editingPrice || dealer.editingPrice <= 0) {
      this.showToast('Please enter a valid price', 'error');
      return;
    }
    dealer.processing = true;
    const price = dealer.editingPrice;
    this.productMgmt.updatePrice(dealer.dealerId, card.id, price).subscribe({
      next: () => {
        dealer.processing   = false;
        dealer.editing      = false;
        dealer.dealerPrice  = price;
        dealer.editingPrice = price;
        this.showToast('Price updated successfully', 'success');
        this.cdr.markForCheck();
      },
      error: () => {
        dealer.processing = false;
        this.showToast('Failed to update price', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  approveWithPrice(card: ProductCard, dealer: DealerProduct) {
    dealer.processing = true;
    const price = dealer.editingPrice ?? dealer.dealerPrice ?? 0;
    this.productMgmt.finalizePrice(dealer.dealerId, card.id).subscribe({
      next: () => {
        const body = [{ productId: card.id, dealerId: dealer.dealerId, price }];
        this.http.put(`${environment.apiUrl}/api/products/approve`, body,
          { responseType: 'text' as 'json' }
        ).subscribe({
          next: (res: any) => {
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
            this.cdr.markForCheck();
          },
          error: () => {
            dealer.processing = false;
            this.showToast(`Failed to approve for ${dealer.dealerName}`, 'error');
            this.cdr.markForCheck();
          }
        });
      },
      error: () => {
        dealer.processing = false;
        this.showToast(`Failed to finalize price for ${dealer.dealerName}`, 'error');
        this.cdr.markForCheck();
      }
    });
  }

  saveApprovedPrice(card: ProductCard, dealer: DealerProduct) {
    dealer.processing = true;
    const price = dealer.editingPrice ?? dealer.dealerPrice ?? 0;
    this.productMgmt.updatePrice(dealer.dealerId, card.id, price).subscribe({
      next: () => {
        dealer.processing   = false;
        dealer.editing      = false;
        dealer.dealerPrice  = price;
        dealer.editingPrice = price;
        this.showToast('Price updated successfully', 'success');
        this.cdr.markForCheck();
      },
      error: () => {
        dealer.processing = false;
        this.showToast(`Failed to update price for ${dealer.dealerName}`, 'error');
        this.cdr.markForCheck();
      }
    });
  }
}
