import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface DealerProduct {
  id: number;
  dealerCode: string;
  dealerName: string;
  dealerPrice: number | null;
  processing: boolean;
  status?: string; // local UI state after action
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
  processing: boolean; // for product-level approve/reject
}

@Component({
  selector: 'app-product-approval',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-approval.component.html',
  styleUrls: ['./product-approval.component.css']
})
export class ProductApprovalComponent implements OnInit {

  activeTab: 'pending' | 'approved' = 'pending';

  pending:  ProductCard[] = [];
  approved: ProductCard[] = [];

  pendingLoading  = false;
  approvedLoading = false;

  searchPending  = '';
  searchApproved = '';

  toast     = '';
  toastType: 'success' | 'error' = 'success';

  constructor(private http: HttpClient, private zone: NgZone) {}

  ngOnInit() {
    this.loadPending();
    this.loadApproved();
  }

  showToast(msg: string, type: 'success' | 'error' = 'success') {
    this.toast     = msg;
    this.toastType = type;
    setTimeout(() => this.toast = '', 3000);
  }

  // ── Data loading ─────────────────────────────────────────────────

  loadPending() {
    this.pendingLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/api/products/pending`).subscribe({
      next: (data) => this.zone.run(() => {
        this.pendingLoading = false;
        this.pending = this.mapCards(data);
      }),
      error: () => this.zone.run(() => {
        this.pendingLoading = false;
        this.showToast('Failed to load pending products', 'error');
      })
    });
  }

  loadApproved() {
    this.approvedLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/api/products/approved`).subscribe({
      next: (data) => this.zone.run(() => {
        this.approvedLoading = false;
        this.approved = this.mapCards(data);
      }),
      error: () => this.zone.run(() => {
        this.approvedLoading = false;
        this.showToast('Failed to load approved products', 'error');
      })
    });
  }

  private mapCards(data: any[]): ProductCard[] {
    return (Array.isArray(data) ? data : []).map(p => ({
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
      dealerProducts: (p.dealerProducts ?? []).map((d: any) => ({
        id:          d.id,
        dealerCode:  d.dealerCode,
        dealerName:  d.dealerName,
        dealerPrice: d.dealerPrice ?? null,
        processing:  false,
        status:      undefined
      }))
    }));
  }

  // ── Filtered lists ────────────────────────────────────────────────

  get filteredPending(): ProductCard[] {
    const q = this.searchPending.toLowerCase();
    return q
      ? this.pending.filter(p =>
          p.productName?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q))
      : this.pending;
  }

  get filteredApproved(): ProductCard[] {
    const q = this.searchApproved.toLowerCase();
    return q
      ? this.approved.filter(p =>
          p.productName?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q))
      : this.approved;
  }

  // ── Expand / collapse ─────────────────────────────────────────────

  toggle(card: ProductCard) {
    card.expanded = !card.expanded;
  }

  // ── Product-level approve / reject (no dealers assigned) ──────────

  approveProduct(card: ProductCard) {
    card.processing = true;
    this.http.put(
      `${environment.apiUrl}/api/products/${card.productCode}/approve`, {},
      { responseType: 'text' as 'json' }
    ).subscribe({
      next: () => this.zone.run(() => {
        card.processing = false;
        this.pending  = this.pending.filter(p => p.productCode !== card.productCode);
        card.status   = 'APPROVED';
        this.approved = [card, ...this.approved];
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
        this.pending = this.pending.filter(p => p.productCode !== card.productCode);
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
      { responseType: 'text' as 'json' }
    ).subscribe({
      next: () => this.zone.run(() => {
        dealer.processing = false;
        dealer.status     = 'APPROVED';
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
      { responseType: 'text' as 'json' }
    ).subscribe({
      next: () => this.zone.run(() => {
        dealer.processing = false;
        dealer.status     = 'REJECTED';
        this.showToast(`Rejected for ${dealer.dealerName}`, 'success');
      }),
      error: () => this.zone.run(() => {
        dealer.processing = false;
        this.showToast(`Failed to reject for ${dealer.dealerName}`, 'error');
      })
    });
  }

  get pendingCount(): number  { return this.pending.length; }
  get approvedCount(): number { return this.approved.length; }
}
