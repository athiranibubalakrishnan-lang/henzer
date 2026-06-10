import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  editPrice = 0;
  editDealerPrice: number | null = null;
  editQuantity = 0;
  brandFilter    = '';
  categoryFilter = '';
  adminBrands:  string[] = [];   // brands for admin/user flat table
  cartQuantities: { [key: string]: number } = {};

  // Dealer tabs
  dealerActiveTab: 'assigned' | 'approved' | 'rejected' = 'assigned';
  dealerSearchAssigned = '';
  dealerSearchApproved = '';
  dealerSearchRejected = '';
  dealerBrandFilter    = '';
  dealerCategoryFilter = '';
  dealerBrands:  string[] = [];  // brands for dealer tabs

  // Dealer pagination
  dealerPageAssigned = 1;
  dealerPageApproved = 1;
  dealerPageRejected = 1;
  readonly PAGE_SIZE = 10;

  // Admin pagination
  adminPage = 1;

  // Price sort
  priceSortAdmin: 'none' | 'asc' | 'desc' = 'none';
  priceSortDealer: 'none' | 'asc' | 'desc' = 'none';

  // Assign to dealer modal
  showAssignModal = false;
  dealers: any[] = [];
  selectedDealerIds: Set<number> = new Set();
  selectedProductIds: Set<number> = new Set();
  assignPrice: number | null = null;
  assignLoading = false;
  assignProductSearch  = '';
  assignCategoryFilter = '';
  assignBrandFilter    = '';
  assignBrands:  string[] = [];

  constructor(
    private productService: ProductService,
    public categoryService: CategoryService,
    private cartService: CartService,
    private productMgmt: ProductManagementService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      // 'brand' query param from header nav filters by category
      // Map "SILICA LITE" → "SILICALITE" to match backend category values
      if (params['brand']) {
        const val = params['brand'].toUpperCase();
        this.categoryFilter = val === 'SILICA LITE' ? 'SILICALITE' : val;
      }
      if (params['uploadSuccess'] === '1') {
        setTimeout(() => this.showToast('✅ Bulk upload successful! Products have been added.'), 300);
      }
    });
    this.loadProducts();
  }

  showToast(msg: string) {
    this.toast = msg;
    setTimeout(() => this.toast = '', 3000);
  }

  loadProducts() {
    this.loading = true;
    const role = localStorage.getItem('role');

    if (role === 'DEALER') {
      this.loadDealerTabs();
      return;
    }

    // Admin → all products
    // PRIVILEGE_USER → approved products only
    // USER / Guest → public bypass endpoint
    let request;
    if (role === 'ADMIN') {
      request = this.productService.getAll();
    } else if (role === 'PRIVILEGE_USER') {
      request = this.productService.getApproved();
    } else {
      request = this.productService.getPublic();
    }

    request.subscribe({
      next: (data) => {
        this.loading = false;
        this.products = (Array.isArray(data) ? data : [])
          .sort((a: any, b: any) => (b.id ?? 0) - (a.id ?? 0));
        // Always reset qty inputs to 1 on fresh load
        this.products.forEach(p => {
          this.cartQuantities[p.productCode] = 1;
        });
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load products', err);
        this.cdr.markForCheck();
      }
    });
  }

  private loadDealerTabs() {
    const myId = Number(localStorage.getItem('dealerId') || 0);
    // Load pending and approved APIs in parallel
    this.http.get<any[]>(`${environment.apiUrl}/api/products/pending`).subscribe({
      next: (pendingData) => {
        this.http.get<any[]>(`${environment.apiUrl}/api/products/approved`).subscribe({
          next: (approvedData) => {
            this.loading = false;
            const all = [
              ...(Array.isArray(pendingData)  ? pendingData  : []),
              ...(Array.isArray(approvedData) ? approvedData : [])
            ];
            // Deduplicate by id
            const seen = new Set<number>();
            this.products = all
              .filter(p => {
                if (seen.has(p.id)) return false;
                seen.add(p.id);
                return true;
              })
              // Only products that have a dealerProducts entry for this dealer
              .filter(p => (p.dealerProducts ?? []).some((d: any) => d.dealerId === myId))
              .sort((a: any, b: any) => (b.id ?? 0) - (a.id ?? 0));

            this.products.forEach(p => {
              this.cartQuantities[p.productCode] = 1;
            });
            this.cdr.markForCheck();
          },
          error: () => { this.loading = false; this.cdr.markForCheck(); }
        });
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  refresh() {
    this.searchText = '';
    this.brandFilter = '';
    this.categoryFilter = '';
    this.adminBrands = [];
    this.dealerSearchAssigned = '';
    this.dealerSearchApproved = '';
    this.dealerSearchRejected = '';
    this.dealerBrandFilter    = '';
    this.dealerCategoryFilter = '';
    this.dealerBrands = [];
    this.adminPage = 1;
    this.dealerPageAssigned = 1;
    this.dealerPageApproved = 1;
    this.dealerPageRejected = 1;
    this.loadProducts();
  }

  get categories(): string[] { return ['All Products']; }

  /** Extracts brand strings from API response — handles both string[] and product object[] */
  private extractBrands(data: any[]): string[] {
    if (!Array.isArray(data) || data.length === 0) return [];
    // If first item is a string, the API returned brand strings directly
    if (typeof data[0] === 'string') {
      return [...new Set(data.filter(Boolean))].sort() as string[];
    }
    // Otherwise treat as product objects and extract .brand
    return [...new Set(data.map((p: any) => p.brand).filter(Boolean))].sort() as string[];
  }

  /** Called when admin/user category dropdown changes */
  onAdminCategoryChange() {
    this.brandFilter = '';
    this.adminPage   = 1;
    this.adminBrands = [];
    if (this.categoryFilter) {
      this.http.get<any[]>(`${environment.apiUrl}/api/products/category/${this.categoryFilter}`).subscribe({
        next: (data) => { this.adminBrands = this.extractBrands(data); },
        error: () => {}
      });
    }
  }

  /** Called when dealer category dropdown changes */
  onDealerCategoryChange() {
    this.dealerBrandFilter = '';
    this.dealerPageAssigned = 1;
    this.dealerPageApproved = 1;
    this.dealerPageRejected = 1;
    this.dealerBrands = [];
    if (this.dealerCategoryFilter) {
      this.http.get<any[]>(`${environment.apiUrl}/api/products/category/${this.dealerCategoryFilter}`).subscribe({
        next: (data) => { this.dealerBrands = this.extractBrands(data); },
        error: () => {}
      });
    }
  }

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

  get isAllProductsSelected(): boolean {
    const list = this.assignableProducts;
    return list.length > 0 && list.every(p => this.selectedProductIds.has(p.id));
  }

  toggleSelectAllProducts() {
    const list = this.assignableProducts;
    if (this.isAllProductsSelected) {
      // Deselect all currently filtered products
      list.forEach(p => this.selectedProductIds.delete(p.id));
    } else {
      // Select all currently filtered products
      list.forEach(p => this.selectedProductIds.add(p.id));
    }
  }

  closeAssignModal() {
    this.showAssignModal = false;
    this.selectedProductIds.clear();
    this.selectedDealerIds.clear();
    this.assignPrice = null;
    this.assignProductSearch  = '';
    this.assignCategoryFilter = '';
    this.assignBrandFilter    = '';
    this.assignBrands = [];
  }

  onAssignCategoryChange() {
    this.assignBrandFilter = '';
    this.assignBrands = [];
    if (this.assignCategoryFilter) {
      this.http.get<any[]>(`${environment.apiUrl}/api/products/category/${this.assignCategoryFilter}`).subscribe({
        next: (data) => { this.assignBrands = this.extractBrands(data); },
        error: () => {}
      });
    }
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
    let base = this.products.filter(p =>
      p.status !== 'APPROVED' &&
      p.status !== 'ASSIGNED' &&
      p.status !== 'REJECTED'
    );
    if (this.assignCategoryFilter) {
      const c = this.assignCategoryFilter.toLowerCase();
      base = base.filter(p => p.category?.toLowerCase() === c);
    }
    if (this.assignBrandFilter) {
      const b = this.assignBrandFilter.toLowerCase();
      base = base.filter(p => p.brand?.toLowerCase() === b);
    }
    if (this.assignProductSearch) {
      const q = this.assignProductSearch.toLowerCase();
      base = base.filter(p =>
        p.productName?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
    }
    return base;
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
    return this.applyDealerFilters(
      this.dealerOwnProducts.filter(p => this.getProductStatus(p) === 'ASSIGNED'),
      this.dealerSearchAssigned
    );
  }

  get dealerApproved(): any[] {
    return this.applyDealerFilters(
      this.dealerOwnProducts.filter(p => this.getProductStatus(p) === 'APPROVED'),
      this.dealerSearchApproved
    );
  }

  get dealerRejected(): any[] {
    return this.applyDealerFilters(
      this.dealerOwnProducts.filter(p => this.getProductStatus(p) === 'REJECTED'),
      this.dealerSearchRejected
    );
  }

  private applyDealerFilters(list: any[], search: string): any[] {
    let result = list;
    if (this.dealerBrandFilter) {
      const b = this.dealerBrandFilter.toLowerCase();
      result = result.filter(p => p.brand?.toLowerCase() === b);
    }
    if (this.dealerCategoryFilter) {
      const c = this.dealerCategoryFilter.toLowerCase();
      result = result.filter(p => p.category?.toLowerCase() === c);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => this.matchesSearch(p, q));
    }
    if (this.priceSortDealer === 'asc') {
      result = [...result].sort((a, b) => (a.supplierPrice ?? 0) - (b.supplierPrice ?? 0));
    } else if (this.priceSortDealer === 'desc') {
      result = [...result].sort((a, b) => (b.supplierPrice ?? 0) - (a.supplierPrice ?? 0));
    }
    return result;
  }

  private matchesSearch(p: any, q: string): boolean {
    return p.productName?.toLowerCase().includes(q) ||
           p.sku?.toLowerCase().includes(q) ||
           p.category?.toLowerCase().includes(q) ||
           p.brand?.toLowerCase().includes(q);
  }

  get uniqueDealerBrands(): string[] {
    return [...new Set(this.dealerOwnProducts.map((p: any) => p.brand).filter(Boolean))].sort() as string[];
  }

  get dealerAssignedCount(): number { return this.dealerOwnProducts.filter(p => this.getProductStatus(p) === 'ASSIGNED').length; }
  get dealerApprovedCount(): number { return this.dealerOwnProducts.filter(p => this.getProductStatus(p) === 'APPROVED').length; }
  get dealerRejectedCount(): number { return this.dealerOwnProducts.filter(p => this.getProductStatus(p) === 'REJECTED').length; }

  // ── Pagination helpers ────────────────────────────────────────────

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

  // Paginated dealer lists
  get pagedDealerAssigned(): any[] { return this.paginate(this.dealerAssigned, this.dealerPageAssigned); }
  get pagedDealerApproved(): any[] { return this.paginate(this.dealerApproved, this.dealerPageApproved); }
  get pagedDealerRejected(): any[] { return this.paginate(this.dealerRejected, this.dealerPageRejected); }

  // Paginated admin list
  get pagedAdminProducts(): any[] { return this.paginate(this.getProductsByCategory('All Products'), this.adminPage); }
  get adminTotalPages(): number    { return this.totalPages(this.getProductsByCategory('All Products').length); }

  /** Gets the dealer's price from dealerProducts entry.
   *  Reads 'price' field first (set by UPDATE_PRICE/FINALIZE_PRICE),
   *  falls back to 'dealerPrice', then top-level p.dealerPrice */
  getDealerPrice(p: any): number | null {
    const myId = Number(localStorage.getItem('dealerId') || 0);
    const entry = (p.dealerProducts ?? []).find((d: any) => d.dealerId === myId);
    if (entry) {
      // 'price' is the field set by UPDATE_PRICE/FINALIZE_PRICE actions
      if (entry.price != null) return entry.price;
      if (entry.dealerPrice != null) return entry.dealerPrice;
    }
    // Fall back to top-level price fields
    return p.price ?? p.dealerPrice ?? null;
  }

  /** Gets the best available price for privileged user view —
   *  reads 'price' field (set by FINALIZE_PRICE), then 'dealerPrice', then top-level */
  getBestDealerPrice(p: any): number | null {
    const dealers: any[] = p.dealerProducts ?? [];
    // Prefer an approved dealer's price field
    const approved = dealers.find((d: any) => d.status === 'APPROVED' && (d.price != null || d.dealerPrice != null));
    if (approved) return approved.price ?? approved.dealerPrice;
    // Any dealer with a price
    const any = dealers.find((d: any) => d.price != null || d.dealerPrice != null);
    if (any) return any.price ?? any.dealerPrice;
    // Top-level fallback
    return p.price ?? p.dealerPrice ?? null;
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
    const price = product.supplierPrice;
    this.showToast(`Adding ${product.productName} x${qty} to cart...`);
    // Reset qty immediately before the API call so it doesn't show stale value
    this.cartQuantities[product.productCode] = 1;
    this.cartService.addItem(product.productCode, qty, price).subscribe({
      next: () => {
        this.cartService.storeProductCode(product.id, product.productCode);
        this.cartService.storeSupplierPrice(product.productCode, product.supplierPrice);
        this.cartQuantities[product.productCode] = 1;
        this.showToast(`✅ ${product.productName} x${qty} added to cart`);
      },
      error: () => this.showToast(`❌ Failed to add to cart`)
    });
  }

  get uniqueAdminBrands(): string[] {
    return [...new Set(this.products.map((p: any) => p.brand).filter(Boolean))].sort() as string[];
  }

  getProductsByCategory(category: string): any[] {
    let filtered = this.products;

    if (this.brandFilter) {
      const b = this.brandFilter.toLowerCase();
      filtered = filtered.filter(p => p.brand?.toLowerCase() === b);
    }

    if (this.categoryFilter) {
      const c = this.categoryFilter.toLowerCase();
      filtered = filtered.filter(p => p.category?.toLowerCase() === c);
    }

    if (this.searchText) {
      filtered = filtered.filter(p =>
        p.productName?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        p.sku?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        p.category?.toLowerCase().includes(this.searchText.toLowerCase()) ||
        p.brand?.toLowerCase().includes(this.searchText.toLowerCase())
      );
    }

    if (this.priceSortAdmin === 'asc') {
      filtered = [...filtered].sort((a, b) => (a.supplierPrice ?? 0) - (b.supplierPrice ?? 0));
    } else if (this.priceSortAdmin === 'desc') {
      filtered = [...filtered].sort((a, b) => (b.supplierPrice ?? 0) - (a.supplierPrice ?? 0));
    }

    return filtered;
  }

  startEdit(p: any) {
    this.editingId       = p.productCode;
    this.editPrice       = p.supplierPrice;   // admin edits this
    this.editDealerPrice = p.dealerPrice ?? null; // dealer edits this — null means empty input
    this.editQuantity    = p.quantity;
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

      if (!this.editDealerPrice || this.editDealerPrice <= 0) {
        this.showToast('Please enter a valid price greater than 0');
        return;
      }

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
          p.dealerPrice  = this.editDealerPrice;
          this.editingId = null;
          this.showToast('Dealer price submitted for admin approval');
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Update failed', err);
          this.showToast('Failed to submit dealer price');
          this.cdr.markForCheck();
        }
      });
      return;
    }

    // Admin: if product has dealer assignments, call process API with UPDATE_PRICE
    // Otherwise do a full product PUT with updated supplier price
    const dealers: any[] = p.dealerProducts ?? [];
    const hasDealer = dealers.length > 0;

    if (hasDealer) {
      // Call process API for each dealer with the new price
      const requests = dealers.map((d: any) =>
        this.productMgmt.updatePrice(d.dealerId, p.id, this.editPrice)
      );
      // Use forkJoin-like sequential calls — or just call for all dealers
      let completed = 0;
      requests.forEach(req => {
        req.subscribe({
          next: () => {
            completed++;
            if (completed === requests.length) {
              p.supplierPrice = this.editPrice;
              this.editingId  = null;
              this.showToast('Price updated successfully');
              this.cdr.markForCheck();
            }
          },
          error: (err: any) => {
            console.error('Update failed', err);
            this.showToast('Failed to update price');
            this.cdr.markForCheck();
          }
        });
      });
      return;
    }

    // No dealers — full product PUT with updated supplier price
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
        p.supplierPrice = this.editPrice;
        p.quantity      = this.editQuantity;
        this.editingId  = null;
        this.showToast('Product updated successfully');
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Update failed', err);
        this.showToast('Failed to update product');
        this.cdr.markForCheck();
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
        this.products = this.products.filter(x => x.productCode !== p.productCode);
        this.showToast('Product deleted successfully');
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Delete failed', err);
        this.showToast('Failed to delete product');
        this.cdr.markForCheck();
      }
    });
  }

  exportExporting = false;

  exportProducts() {
    this.exportExporting = true;
    this.http.get(`${environment.apiUrl}/api/products/export`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        this.exportExporting = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'products.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
        this.cdr.markForCheck();
      },
      error: () => {
        this.exportExporting = false;
        this.showToast('Failed to export products');
        this.cdr.markForCheck();
      }
    });
  }
}
