import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface OrderItem {
  id:            number;
  quantity:      number;
  unitPrice:     number;
  lineTotal:     number | null;
  productName:   string;
  productCode:   string;
  sku:           string;
  brand:         string;
  category:      string;
  supplierPrice: number;
}

interface OrderCard {
  orderId:     number;
  status:      string;
  totalAmount: number;
  packageFee:  number | null;
  createdAt:   string;
  userName:    string;
  userEmail:   string;
  userAddress: any;
  dealerName:  string;
  dealerEmail: string;
  items:       OrderItem[];
  expanded:    boolean;
  selected:    boolean;
}

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.css']
})
export class OrderHistoryComponent implements OnInit {

  orders: OrderCard[] = [];
  loading = false;
  error   = '';
  searchText   = '';
  currentPage  = 1;
  pageSize = 10;

  get PAGE_SIZE(): number { return this.pageSize; }

  onPageSizeChange() {
    const val = Number(this.pageSize);
    this.pageSize = (!val || val < 1) ? 10 : val;
    this.currentPage = 1;
  }
  bulkApproving    = false;
  approveToast     = '';
  approveToastType: 'success' | 'error' = 'success';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.loadOrders(); }

  get isUser(): boolean {
    const role = localStorage.getItem('role');
    return role === 'USER' || role === 'PRIVILEGE_USER';
  }

  get isAdmin():  boolean { return localStorage.getItem('role') === 'ADMIN'; }
  get isDealer(): boolean { return localStorage.getItem('role') === 'DEALER'; }

  loadOrders() {
    this.loading = true;
    this.error   = '';
    const role = localStorage.getItem('role');
    let url: string;
    if (role === 'ADMIN') {
      url = `${environment.apiUrl}/api/orders/all`;
    } else {
      url = `${environment.apiUrl}/api/orders/status/CONFIRMED`;
    }

    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        this.loading = false;
        this.orders  = this.mapOrders(Array.isArray(data) ? data : []);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.error   = `Failed to load orders (${err?.status ?? 'error'}): ${err?.error?.message || err?.message || 'Please try again.'}`;
        this.cdr.markForCheck();
      }
    });
  }

  private mapOrders(data: any[]): OrderCard[] {
    const cards: OrderCard[] = [];
    data.forEach(entry => {
      const user  = entry.userDetails ?? {};
      const order = entry.order ?? {};
      const rawItems: any[] = order.items ?? [];

      const firstItem   = rawItems[0] ?? {};
      const dealerRaw   = firstItem.dealerDetails ?? firstItem.dealer ?? {};
      const dealerName  = dealerRaw.userName ?? dealerRaw.username ?? dealerRaw.dealerName ?? '—';
      const dealerEmail = dealerRaw.email ?? dealerRaw.dealerCode ?? '—';

      const items: OrderItem[] = rawItems.map(item => {
        const p = item.product ?? {};
        return {
          id:            item.id,
          quantity:      item.quantity ?? 0,
          unitPrice:     item.unitPrice ?? 0,
          lineTotal:     item.lineTotal ?? null,
          productName:   p.productName ?? '—',
          productCode:   p.productCode ?? '—',
          sku:           p.sku ?? '—',
          brand:         p.brand ?? '—',
          category:      p.category ?? '—',
          supplierPrice: p.supplierPrice ?? 0
        };
      });

      cards.push({
        orderId:     order.id,
        status:      order.status ?? '—',
        totalAmount: order.totalAmount ?? 0,
        packageFee:  order.packageFee ?? null,
        createdAt:   order.createdAt ?? '',
        userName:    user.userName ?? user.username ?? '—',
        userEmail:   user.email ?? '—',
        userAddress: user.address ?? null,
        dealerName,
        dealerEmail,
        items,
        expanded: false,
        selected: false
      });
    });
    return cards;
  }

  toggle(card: OrderCard) { card.expanded = !card.expanded; }

  get filtered(): OrderCard[] {
    const q = this.searchText.toLowerCase();
    if (!q) return this.orders;
    return this.orders.filter(r =>
      r.userName?.toLowerCase().includes(q) ||
      r.dealerName?.toLowerCase().includes(q) ||
      r.status?.toLowerCase().includes(q) ||
      r.items.some(i =>
        i.productName?.toLowerCase().includes(q) ||
        i.brand?.toLowerCase().includes(q) ||
        i.sku?.toLowerCase().includes(q)
      )
    );
  }

  get paged(): OrderCard[] {
    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    return this.filtered.slice(start, start + this.PAGE_SIZE);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.PAGE_SIZE));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get selectedOrders(): OrderCard[] { return this.filtered.filter(r => r.selected); }
  get selectedCount():  number       { return this.selectedOrders.length; }

  get isAllSelected(): boolean {
    const f = this.filtered;
    return f.length > 0 && f.every(r => r.selected);
  }

  toggleSelectAll() {
    const all = this.isAllSelected;
    this.filtered.forEach(r => r.selected = !all);
  }

  showApproveToast(msg: string, type: 'success' | 'error' = 'success') {
    this.approveToast     = msg;
    this.approveToastType = type;
    setTimeout(() => this.approveToast = '', 3000);
  }

  bulkApprove() {
    const ids = this.selectedOrders.map(r => r.orderId);
    if (ids.length === 0) return;
    this.bulkApproving = true;
    this.http.put(
      `${environment.apiUrl}/api/orders/bulk-status/CONFIRMED`, ids,
      { responseType: 'text' as 'json' }
    ).subscribe({
      next: (res: any) => {
        this.bulkApproving = false;
        this.selectedOrders.forEach(r => { r.status = 'CONFIRMED'; r.selected = false; });
        this.showApproveToast(res || `${ids.length} order(s) confirmed`, 'success');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.bulkApproving = false;
        this.showApproveToast(err?.error || 'Failed to confirm orders', 'error');
        this.cdr.markForCheck();
      }
    });
  }
}
