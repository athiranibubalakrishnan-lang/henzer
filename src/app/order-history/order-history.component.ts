import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface OrderRow {
  orderId:     number;
  status:      string;
  totalAmount: number;
  createdAt:   string;
  userName:    string;
  userEmail:   string;
  productName: string;
  brand:       string;
  sku:         string;
  dealerName:  string;
  dealerEmail: string;
  quantity:    number;
  unitPrice:   number;
}

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.css']
})
export class OrderHistoryComponent implements OnInit {

  orders: OrderRow[] = [];
  loading = false;
  error   = '';
  searchText = '';
  currentPage = 1;
  readonly PAGE_SIZE = 10;

  constructor(private http: HttpClient, private zone: NgZone) {}

  ngOnInit() { this.loadOrders(); }

  get isUser(): boolean {
    const role = localStorage.getItem('role');
    return role === 'USER' || role === 'PRIVILEGE_USER';
  }

  get isAdmin(): boolean {
    return localStorage.getItem('role') === 'ADMIN';
  }

  loadOrders() {
    this.loading = true;
    this.error   = '';
    // Admin/Dealer use /api/orders/all; users use /api/orders
    const url = this.isUser
      ? `${environment.apiUrl}/api/orders`
      : `${environment.apiUrl}/api/orders/all`;

    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.loading = false;
          this.orders  = this.flattenOrders(Array.isArray(data) ? data : []);
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.loading = false;
          this.error   = `Failed to load orders (${err?.status ?? 'unknown error'}): ${err?.error?.message || err?.message || 'Please try again.'}`;
          console.error('Order history error:', err);
        });
      }
    });
  }

  private flattenOrders(data: any[]): OrderRow[] {
    const rows: OrderRow[] = [];
    data.forEach(entry => {
      const user    = entry.userDetails ?? {};
      const order   = entry.order ?? {};
      const items: any[] = order.items ?? [];

      items.forEach(item => {
        const product = item.product ?? {};
        const dealer  = item.dealerDetails ?? {};

        rows.push({
          orderId:     order.id,
          status:      order.status ?? '—',
          totalAmount: order.totalAmount ?? 0,
          createdAt:   order.createdAt ?? '',
          userName:    user.userName ?? '—',
          userEmail:   user.email ?? '—',
          productName: product.productName ?? '—',
          brand:       product.brand ?? '—',
          sku:         product.sku ?? '—',
          dealerName:  dealer.userName ?? '—',
          dealerEmail: dealer.email ?? '—',
          quantity:    item.quantity ?? 0,
          unitPrice:   item.unitPrice ?? 0
        });
      });
    });
    return rows;
  }

  get filtered(): OrderRow[] {
    const q = this.searchText.toLowerCase();
    if (!q) return this.orders;
    return this.orders.filter(r =>
      r.productName?.toLowerCase().includes(q) ||
      r.brand?.toLowerCase().includes(q) ||
      r.sku?.toLowerCase().includes(q) ||
      r.userName?.toLowerCase().includes(q) ||
      r.dealerName?.toLowerCase().includes(q) ||
      r.status?.toLowerCase().includes(q)
    );
  }

  get paged(): OrderRow[] {
    const start = (this.currentPage - 1) * this.PAGE_SIZE;
    return this.filtered.slice(start, start + this.PAGE_SIZE);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.PAGE_SIZE));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
