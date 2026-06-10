import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProductManagementService } from '../services/product-management.service';
import { environment } from '../../environments/environment';

export interface DealerAssignment {
  dealerId: number;
  dealerName: string;
  dealerEmail: string;
  assignedPrice: number | null;
  proposedPrice: number | null;
  status: string;
  processing: boolean;
}

export interface ProductAssignmentGroup {
  productId: number;
  productName: string;
  brand: string;
  category: string;
  sku: string;
  supplierPrice: number;
  dealers: DealerAssignment[];
  expanded: boolean;
}

export interface PriceProposal {
  productId: number;
  productName: string;
  brand: string;
  category: string;
  sku: string;
  supplierPrice: number;
  dealerPrice: number | null;
  proposedPrice: number;
  dealerId: number;
  dealerName: string;
  dealerEmail: string;
  status: string;
  processing: boolean;
}

@Component({
  selector: 'app-admin-price-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-price-review.component.html',
  styleUrls: ['./admin-price-review.component.css']
})
export class AdminPriceReviewComponent implements OnInit {

  activeTab: 'assignments' | 'review' = 'assignments';

  // ── Tab 1: Assignments ──────────────────────────────────────────────
  assignmentGroups: ProductAssignmentGroup[] = [];
  assignmentsLoading = false;
  assignFilterCategory = 'All';
  assignFilterDealer   = 'All';
  assignCategories: string[] = [];
  assignDealers: string[]    = [];

  // ── Tab 2: Price Review ─────────────────────────────────────────────
  proposals: PriceProposal[] = [];
  reviewLoading = false;
  filterCategory = 'All';
  filterDealer   = 'All';
  filterStatus   = 'PENDING_APPROVAL';
  reviewCategories: string[] = [];
  reviewDealers: string[]    = [];

  toast = '';
  toastType: 'success' | 'error' = 'success';

  constructor(
    private http: HttpClient,
    private productMgmt: ProductManagementService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAssignments();
    this.loadProposals();
  }

  showToast(msg: string, type: 'success' | 'error' = 'success') {
    this.toast = msg;
    this.toastType = type;
    setTimeout(() => this.toast = '', 3000);
  }

  switchTab(tab: 'assignments' | 'review') {
    this.activeTab = tab;
  }

  // ── Assignments ─────────────────────────────────────────────────────

  loadAssignments() {
    this.assignmentsLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/api/products/assignments`).subscribe({
      next: (data) => {
        this.assignmentsLoading = false;
        this.assignmentGroups = (Array.isArray(data) ? data : []).map(item => ({
          productId:     item.productId ?? item.id,
          productName:   item.productName,
          brand:         item.brand,
          category:      item.category,
          sku:           item.sku,
          supplierPrice: item.supplierPrice ?? item.price,
          expanded:      false,
          dealers: (item.dealers ?? []).map((d: any) => ({
            dealerId:      d.dealerId,
            dealerName:    d.dealerName ?? d.dealerEmail,
            dealerEmail:   d.dealerEmail,
            assignedPrice: d.assignedPrice ?? d.dealerPrice ?? null,
            proposedPrice: d.proposedPrice ?? null,
            status:        d.status ?? 'ASSIGNED',
            processing:    false
          }))
        }));
        const cats = [...new Set(this.assignmentGroups.map(g => g.category).filter(Boolean))];
        this.assignCategories = ['All', ...cats];
        const dlrs = [...new Set(
          this.assignmentGroups.flatMap(g => g.dealers.map(d => d.dealerName)).filter(Boolean)
        )];
        this.assignDealers = ['All', ...dlrs];
        this.cdr.markForCheck();
      },
      error: () => {
        this.assignmentsLoading = false;
        this.showToast('Failed to load assignments', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  get filteredGroups(): ProductAssignmentGroup[] {
    return this.assignmentGroups.filter(g => {
      const catOk = this.assignFilterCategory === 'All' || g.category === this.assignFilterCategory;
      const dlrOk = this.assignFilterDealer   === 'All' ||
                    g.dealers.some(d => d.dealerName === this.assignFilterDealer);
      return catOk && dlrOk;
    });
  }

  visibleDealers(group: ProductAssignmentGroup): DealerAssignment[] {
    if (this.assignFilterDealer === 'All') return group.dealers;
    return group.dealers.filter(d => d.dealerName === this.assignFilterDealer);
  }

  toggleExpand(group: ProductAssignmentGroup) {
    group.expanded = !group.expanded;
  }

  expandAll()   { this.filteredGroups.forEach(g => g.expanded = true);  }
  collapseAll() { this.filteredGroups.forEach(g => g.expanded = false); }

  get totalAssigned(): number {
    return this.assignmentGroups.reduce((sum, g) => sum + g.dealers.length, 0);
  }

  // ── Price Review ────────────────────────────────────────────────────

  loadProposals() {
    this.reviewLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/api/products/price-proposals`).subscribe({
      next: (data) => {
        this.reviewLoading = false;
        this.proposals = (Array.isArray(data) ? data : []).map(p => ({
          productId:     p.productId ?? p.id,
          productName:   p.productName,
          brand:         p.brand,
          category:      p.category,
          sku:           p.sku,
          supplierPrice: p.supplierPrice ?? p.price,
          dealerPrice:   p.dealerPrice ?? null,
          proposedPrice: p.proposedPrice,
          dealerId:      p.dealerId,
          dealerName:    p.dealerName ?? p.dealerEmail,
          dealerEmail:   p.dealerEmail,
          status:        p.status ?? 'PENDING_APPROVAL',
          processing:    false
        }));
        const cats = [...new Set(this.proposals.map(p => p.category).filter(Boolean))];
        this.reviewCategories = ['All', ...cats];
        const dlrs = [...new Set(this.proposals.map(p => p.dealerName).filter(Boolean))];
        this.reviewDealers = ['All', ...dlrs];
        this.cdr.markForCheck();
      },
      error: () => {
        this.reviewLoading = false;
        this.showToast('Failed to load price proposals', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  get filteredProposals(): PriceProposal[] {
    return this.proposals.filter(p => {
      const catOk    = this.filterCategory === 'All' || p.category === this.filterCategory;
      const dlrOk    = this.filterDealer   === 'All' || p.dealerName === this.filterDealer;
      const statusOk = this.filterStatus   === 'All' || p.status === this.filterStatus;
      return catOk && dlrOk && statusOk;
    });
  }

  approve(proposal: PriceProposal) {
    proposal.processing = true;
    this.productMgmt.finalizePrice(proposal.dealerId, proposal.productId).subscribe({
      next: () => {
        proposal.processing = false;
        proposal.status = 'FINALIZE_PRICE';
        this.showToast(`Price approved for ${proposal.productName}`, 'success');
        const group = this.assignmentGroups.find(g => g.productId === proposal.productId);
        const dealer = group?.dealers.find(d => d.dealerId === proposal.dealerId);
        if (dealer) dealer.status = 'FINALIZE_PRICE';
        this.cdr.markForCheck();
      },
      error: () => {
        proposal.processing = false;
        this.showToast('Failed to approve price', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  reject(proposal: PriceProposal) {
    proposal.processing = true;
    this.http.post(`${environment.apiUrl}/api/products/process`, {
      action: 'REJECT_PRICE',
      dealerId: proposal.dealerId,
      productId: proposal.productId
    }).subscribe({
      next: () => {
        proposal.processing = false;
        proposal.status = 'REJECTED';
        this.showToast(`Price rejected for ${proposal.productName}`, 'success');
        const group = this.assignmentGroups.find(g => g.productId === proposal.productId);
        const dealer = group?.dealers.find(d => d.dealerId === proposal.dealerId);
        if (dealer) dealer.status = 'REJECTED';
        this.cdr.markForCheck();
      },
      error: () => {
        proposal.processing = false;
        this.showToast('Failed to reject price', 'error');
        this.cdr.markForCheck();
      }
    });
  }

  get pendingCount(): number {
    return this.proposals.filter(p => p.status === 'PENDING_APPROVAL').length;
  }
}