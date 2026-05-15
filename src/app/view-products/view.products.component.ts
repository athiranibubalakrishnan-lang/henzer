import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { ProductService } from '../product.service';
import { CategoryService } from '../services/category.service';
import { CartService } from '../services/cart.service';
import { ProductManagementService } from '../services/product-management.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-view-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './view.products.component.html',
  styleUrls: ['./view.products.component.css']
})
export class ViewProductsComponent implements OnInit {

  searchText = '';
  products: any[] = [];
  loading = false;
  toast = '';
  editingId: string | null = null;
  editPrice = 0;        // admin: supplier price
  editDealerPrice = 0;  // dealer: dealer price
  editQuantity = 0;
  brandFilter = '';
  cartQuantities: { [key: string]: number } = {};

  // Dealer tabs
  dealerActiveTab: 'assigned' | 'approved' | 'rejected' = 'assigned';
  dealerSearchAssigned = '';
  dealerSearchApproved = '';
  dealerSearchRejected = '';

  // Assign to dealer modal
  showAssignModal = false;
  dealers: any[] = [];
  selectedDealerIds: Set<number> = new Set();
  selectedProductIds: Set<number> = new Set();
  assignPrice: number | null = null;
  assignLoading = false;

  constructor(
    private productService: ProductService,
    public categoryService: CategoryService,
    private cartService: CartService,
    private productMgmt: ProductManagementService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.brandFilter = params['brand'] || '';
    });
    this.loadProducts();
  }

  showToast(msg: string) {
    this.toast = msg;
    setTimeout(() => this.toast = '', 3000);
  }

  loadProducts() {
    this.loading = true;
    const isGuest = !localStorage.getItem('token');
    const request = isGuest ? this.productService.getPublic() : this.productService.getAll();
    request.subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.loading = false;
          this.products = Array.isArray(data) ? data : [];
          this.products.forEach(p => {
            if (!this.cartQuantities[p.productCode]) {
              this.cartQuantities[p.productCode] = 1;
            }
          });
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.loading = false;
          console.error('Failed to load products', err);
        });
      }
    });
  }

  refresh() {
    this.searchText = '';
    this.loadProducts();
  }

  get categories(): string[] { return ['All Products']; }

  get isDealer(): boolean {
    return localStorage.getItem('role') === 'DEALER';
  }

  get isAdmin(): boolean {
    return localStorage.getItem('role') === 'ADMIN';
  }

  assignToDealer() {
    this.selectedProductIds.clear();
    this.selectedDealerIds.clear();
    this.showAssignModal = true;
    this.loadDealers();
  }

  loadDealers() {
    this.http.get<any[]>(`${environment.apiUrl}/api/users`).subscribe({
      next: (data) => this.dealers = Array.isArray(data) ? data.filter(u => u.role === 'DEALER') : [],
      error: () => {}
    });
  }

  toggleDealerSelection(id: number) {
    if (this.selectedDealerIds.has(id)) {
      this.selectedDealerIds.delete(id);
    } else {
      this.selectedDealerIds.add(id);
    }
  }

  isDealerSelected(id: number): boolean {
    return this.selectedDealerIds.has(id);
  }

  toggleProductSelection(id: number) {
    if (this.selectedProductIds.has(id)) {
      this.selectedProductIds.delete(id);
    } else {
      this.selectedProductIds.add(id);
    }
  }

  isSelected(id: number): boolean {
    return this.selectedProductIds.has(id);
  }

  closeAssignModal() {
    this.showAssignModal = false;
    this.selectedProductIds.clear();
    this.selectedDealerIds.clear();
    this.assignPrice = null;
  }

  confirmAssign() {
    if (this.selectedDealerIds.size === 0) { this.showToast('Please select at least one dealer'); return; }
    if (this.selectedProductIds.size === 0) { this.showToast('Please select at least one product'); return; }
    this.assignLoading = true;
    const productIds = Array.from(this.selectedProductIds);
    const dealerIds  = Array.from(this.selectedDealerIds);
    const price = this.assignPrice !== null ? this.assignPrice : undefined;
    this.productMgmt.assign(productIds, dealerIds, price).subscribe({
      next: () => {
        this.assignLoading = false;
        this.closeAssignModal();
        this.showToast('Products assigned to dealer(s) successfully');
      },
      error: () => {
        this.assignLoading = false;
        this.showToast('Failed to assign products');
      }
    });
  }

  get isRegularUser(): boolean {
    return localStorage.getItem('role') === 'USER';
  }

  /** Products eligible for dealer assignment — excludes approved, assigned and rejected ones */
  get assignableProducts(): any[] {
    return this.products.filter(p =>
      p.status !== 'APPROVED' &&
      p.status !== 'ASSIGNED' &&
      p.status !== 'REJECTED'
    );
  }

  get isGuest(): boolean {
    return !localStorage.getItem('token');
  }

  /**
   * Derives a single clean display status for a product.
   *
   * For DEALER:
   *   1. Check their own entry in dealerProducts (matched by dealerId)
   *   2. Fall back to p.status on the product itself
   *   - null / no entry → 'ASSIGNED'
   *   - APPROVED        → 'APPROVED'
   *   - REJECTED        → 'REJECTED'
   *
   * For ADMIN: looks across all dealer entries.
   *   - Empty array          → 'PENDING'
   *   - All statuses null    → 'ASSIGNED'
   *   - At least one APPROVED → 'APPROVED'
   *   - All actioned REJECTED → 'REJECTED'
   *   - Mixed                → 'ASSIGNED'
   */
  getProductStatus(p: any): string {
    const dealers: any[] = p.dealerProducts ?? [];

    // Dealer: check their own dealerProducts entry first, then fall back to p.status
    if (this.isDealer) {
      const myId = Number(localStorage.getItem('dealerId') || 0);
      const myEntry = dealers.find((d: any) => d.dealerId === myId);

      // Use the dealer-specific entry status if found
      if (myEntry) {
        return myEntry.status == null ? 'ASSIGNED' : myEntry.status;
      }

      // Fall back to the product-level status field
      const productStatus: string | null = p.status ?? null;
      if (productStatus === 'APPROVED') return 'APPROVED';
      if (productStatus === 'REJECTED') return 'REJECTED';

      return 'ASSIGNED';
    }

    // Admin: derive overall status from all dealer entries
    if (dealers.length === 0) return 'PENDING';

    const statuses = dealers.map((d: any) => d.status).filter((s: any) => s != null);
    if (statuses.length === 0) return 'ASSIGNED';

    const hasApproved = statuses.some((s: string) => s === 'APPROVED');
    if (hasApproved) return 'APPROVED';

    const allRejected = statuses.every((s: string) => s === 'REJECTED');
    if (allRejected) return 'REJECTED';

    return 'ASSIGNED';
  }

  /** Returns the CSS class for the status badge */
  getProductStatusClass(p: any): string {
    return this.getProductStatus(p).toLowerCase();
  }

  // ── Dealer tab lists ──────────────────────────────────────────────

  /** All products that belong to this dealer — either via dealerProducts entry or p.status */
  private get dealerOwnProducts(): any[] {
    const myId = Number(localStorage.getItem('dealerId') || 0);
    return this.products.filter(p => {
      // Has a dealerProducts entry for this dealer
      const hasEntry = (p.dealerProducts ?? []).some((d: any) => d.dealerId === myId);
      if (hasEntry) return true;
      // Or product-level status indicates it was assigned/actioned for this dealer
      const s: string | null = p.status ?? null;
      return s === 'APPROVED' || s === 'REJECTED' || s === 'ASSIGNED';
    });
  }

  get dealerAssigned(): any[] {
    const q = this.dealerSearchAssigned.toLowerCase();
    const list = this.dealerOwnProducts.filter(p => this.getProductStatus(p) === 'ASSIGNED');
    return q ? list.filter(p => this.matchesSearch(p, q)) : list;
  }

  get dealerApproved(): any[] {
    const q = this.dealerSearchApproved.toLowerCase();
    const list = this.dealerOwnProducts.filter(p => this.getProductStatus(p) === 'APPROVED');
    return q ? list.filter(p => this.matchesSearch(p, q)) : list;
  }

  get dealerRejected(): any[] {
    const q = this.dealerSearchRejected.toLowerCase();
    const list = this.dealerOwnProducts.filter(p => this.getProductStatus(p) === 'REJECTED');
    return q ? list.filter(p => this.matchesSearch(p, q)) : list;
  }

  private matchesSearch(p: any, q: string): boolean {
    return p.productName?.toLowerCase().includes(q) ||
           p.sku?.toLowerCase().includes(q) ||
           p.category?.toLowerCase().includes(q);
  }

  get dealerAssignedCount(): number { return this.dealerOwnProducts.filter(p => this.getProductStatus(p) === 'ASSIGNED').length; }
  get dealerApprovedCount(): number { return this.dealerOwnProducts.filter(p => this.getProductStatus(p) === 'APPROVED').length; }
  get dealerRejectedCount(): number { return this.dealerOwnProducts.filter(p => this.getProductStatus(p) === 'REJECTED').length; }

  /** Gets the dealer price for the logged-in dealer from a product's dealerProducts array */
  getDealerPrice(p: any): number | null {
    const myId = Number(localStorage.getItem('dealerId') || 0);
    const entry = (p.dealerProducts ?? []).find((d: any) => d.dealerId === myId);
    return entry?.dealerPrice ?? null;
  }

  get isPrivilegedUser(): boolean {
    return localStorage.getItem('role') === 'PRIVILEGE_USER';
  }

  addToCart(product: any) {
    this.showToast(`Adding ${product.productName} to cart...`);
    this.cartService.addItem(product.productCode, 1).subscribe({
      next: () => this.showToast(`✅ ${product.productName} added to cart`),
      error: () => this.showToast(`❌ Failed to add to cart`)
    });
  }

  addToCartWithQty(product: any) {
    const qty = this.cartQuantities[product.productCode] || 1;
    this.showToast(`Adding ${product.productName} x${qty} to cart...`);
    this.cartService.addItem(product.productCode, qty).subscribe({
      next: () => {
        this.cartQuantities[product.productCode] = 1;
        this.showToast(`✅ ${product.productName} x${qty} added to cart`);
      },
      error: () => this.showToast(`❌ Failed to add to cart`)
    });
  }

  getProductsByCategory(category: string): any[] {
    let filtered = this.products;

    // Dealers should not see products in PENDING state (derived from dealerProducts)
    if (this.isDealer) {
      filtered = filtered.filter(p => this.getProductStatus(p) !== 'PENDING');
    }

    if (this.brandFilter) {
      filtered = filtered.filter(p =>
        p.brand?.toLowerCase().includes(this.brandFilter.toLowerCase()) ||
        p.category?.toLowerCase().includes(this.brandFilter.toLowerCase())
      );
    }

    if (this.searchText) {
      filtered = filtered.filter(p =>
        p.productName?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        p.sku?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        p.category?.toLowerCase().includes(this.searchText.toLowerCase())
      );
    }

    return filtered;
  }

  startEdit(p: any) {
    this.editingId      = p.productCode;
    this.editPrice      = p.supplierPrice;   // admin edits this
    this.editDealerPrice = p.dealerPrice ?? 0; // dealer edits this
    this.editQuantity   = p.quantity;
  }

  cancelEdit() { this.editingId = null; }

  saveEdit(p: any) {
    if (!p.productCode) {
      this.showToast('Cannot update: product code missing');
      return;
    }

    // Dealer: submit proposed dealer price via POST /api/products/process (UPDATE_PRICE)
    if (this.isDealer) {
      const dealerId  = Number(localStorage.getItem('dealerId') || 0);
      // Backend needs the numeric DB primary key (ProductEntity.id), not productCode
      const productId = Number(p.id ?? p.productId ?? 0);

      console.log('UPDATE_PRICE → dealerId:', dealerId, '| productId:', productId, '| price:', this.editDealerPrice, '| full product object:', p);

      if (!dealerId) {
        this.showToast('Session error: dealer ID missing. Please log in again.');
        return;
      }
      if (!productId) {
        this.showToast('Cannot update: product ID missing.');
        return;
      }

      this.productMgmt.updatePrice(dealerId, productId, this.editDealerPrice).subscribe({
        next: () => {
          this.zone.run(() => {
            p.dealerPrice  = this.editDealerPrice;
            this.editingId = null;
            this.showToast('Dealer price submitted for admin approval');
          });
        },
        error: (err) => {
          this.zone.run(() => {
            console.error('Update failed', err);
            this.showToast('Failed to submit dealer price');
          });
        }
      });
      return;
    }

    // Admin: full product PUT with updated supplier price
    const payload = {
      productCode:        p.productCode,
      productName:        p.productName,
      category:           p.category,
      sku:                p.sku,
      supplierCode:       p.supplierCode,
      brand:              p.brand,
      status:             p.status,
      active:             p.active,
      inStock:            p.inStock,
      visibility:         p.visibility ?? 'PUBLIC',
      publishedStatus:    p.publishedStatus ?? true,
      shortDescription:   p.shortDescription,
      description:        p.description,
      productDescription: p.productDescription,
      remarks:            p.remarks,
      supplierPrice:      this.editPrice,
      quantity:           this.editQuantity
    };

    this.productService.update(p.productCode, payload).subscribe({
      next: () => {
        this.zone.run(() => {
          p.supplierPrice = this.editPrice;
          p.quantity      = this.editQuantity;
          this.editingId  = null;
          this.showToast('Product updated successfully');
        });
      },
      error: (err) => {
        this.zone.run(() => {
          console.error('Update failed', err);
          this.showToast('Failed to update product');
        });
      }
    });
  }

  deleteProduct(p: any) {
    if (!confirm(`Delete "${p.productName}"?`)) return;
    console.log('Deleting product:', p.productCode);
    if (!p.productCode) {
      this.showToast('Cannot delete: product code missing');
      return;
    }
    this.productService.delete(p.productCode).subscribe({
      next: () => {
        this.zone.run(() => {
          this.products = this.products.filter(x => x.productCode !== p.productCode);
          this.showToast('Product deleted successfully');
        });
      },
      error: (err) => {
        this.zone.run(() => {
          console.error('Delete failed', err);
          this.showToast('Failed to delete product');
        });
      }
    });
  }
}
