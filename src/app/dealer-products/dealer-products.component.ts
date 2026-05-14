import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProductManagementService } from '../services/product-management.service';
import { environment } from '../../environments/environment';

interface DealerProductRow {
  productId: number;
  productCode: string;
  productName: string;
  brand: string;
  category: string;
  sku: string;
  supplierPrice: number;
  dealerPrice: number | null;
  proposedPrice: number | null;
  productStatus: string;  // PENDING / APPROVED / REJECTED / ASSIGNED
  status: string;         // dealer-level status
  editing: boolean;
  saving: boolean;
}

@Component({
  selector: 'app-dealer-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dealer-products.component.html',
  styleUrls: ['./dealer-products.component.css']
})
export class DealerProductsComponent implements OnInit {

  products: DealerProductRow[] = [];
  loading = false;
  toast = '';
  toastType: 'success' | 'error' = 'success';

  // category filter
  categories: string[] = [];
  selectedCategory = 'All';

  constructor(
    private http: HttpClient,
    private productMgmt: ProductManagementService,
    private zone: NgZone
  ) {}

  ngOnInit() {
    this.loadAssignedProducts();
  }

  get dealerId(): number {
    // Backend should store dealerId in localStorage at login time alongside 'token' and 'role'
    const id = localStorage.getItem('dealerId');
    if (!id) {
      console.warn('dealerId not found in localStorage — ensure login response stores it');
    }
    return Number(id || 0);
  }

  showToast(msg: string, type: 'success' | 'error' = 'success') {
    this.toast = msg;
    this.toastType = type;
    setTimeout(() => this.toast = '', 3000);
  }

  loadAssignedProducts() {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/api/dealers/products`).subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.loading = false;
          this.products = (Array.isArray(data) ? data : []).map(p => ({
            productId:     p.productId ?? p.id,
            productCode:   p.productCode,
            productName:   p.productName,
            brand:         p.brand,
            category:      p.category,
            sku:           p.sku,
            supplierPrice: p.supplierPrice ?? p.price,
            dealerPrice:   p.dealerPrice ?? null,
            proposedPrice: p.proposedPrice ?? p.dealerPrice ?? null,
            productStatus: p.status ?? '',
            status:        p.dealerStatus ?? '',
            editing:       false,
            saving:        false
          }));
          const cats = [...new Set(this.products.map(p => p.category).filter(Boolean))];
          this.categories = ['All', ...cats];
        });
      },
      error: () => {
        this.zone.run(() => {
          this.loading = false;
          this.showToast('Failed to load assigned products', 'error');
        });
      }
    });
  }

  get filteredProducts(): DealerProductRow[] {
    if (this.selectedCategory === 'All') return this.products;
    return this.products.filter(p => p.category === this.selectedCategory);
  }

  startEdit(row: DealerProductRow) {
    row.editing = true;
  }

  cancelEdit(row: DealerProductRow) {
    row.editing = false;
  }

  savePrice(row: DealerProductRow) {
    if (row.proposedPrice === null || row.proposedPrice === undefined) {
      this.showToast('Please enter a price', 'error');
      return;
    }
    row.saving = true;
    this.productMgmt.updatePrice(this.dealerId, row.productId, row.proposedPrice).subscribe({
      next: () => {
        this.zone.run(() => {
          row.saving = false;
          row.editing = false;
          row.status = 'PENDING_APPROVAL';
          this.showToast(`Price updated for ${row.productName}`, 'success');
        });
      },
      error: () => {
        this.zone.run(() => {
          row.saving = false;
          this.showToast('Failed to update price', 'error');
        });
      }
    });
  }
}
