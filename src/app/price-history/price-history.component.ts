import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface PriceRecord {
  oldPrice:  number;
  newPrice:  number;
  updatedAt: string;
  updatedBy: string;
  expanded:  boolean;
}

@Component({
  selector: 'app-price-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './price-history.component.html',
  styleUrls: ['./price-history.component.css']
})
export class PriceHistoryComponent implements OnInit {

  dealerId   = 0;
  productId  = 0;
  dealerName = '';
  productName = '';

  records: PriceRecord[] = [];
  loading = false;
  error   = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private zone: NgZone
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.dealerId  = Number(params['dealerId']);
      this.productId = Number(params['productId']);
    });
    this.route.queryParams.subscribe(params => {
      this.dealerName  = params['dealerName']  || '';
      this.productName = params['productName'] || '';
    });
    this.loadHistory();
  }

  loadHistory() {
    this.loading = true;
    this.error   = '';
    this.http.get<any[]>(
      `${environment.apiUrl}/api/dealer/dealer/${this.dealerId}/product/${this.productId}/price-history`
    ).subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.loading = false;
          this.records = (Array.isArray(data) ? data : []).map(r => ({ ...r, expanded: false }));
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.loading = false;
          this.error   = `Failed to load price history (${err?.status ?? 'error'})`;
        });
      }
    });
  }

  toggle(record: PriceRecord) {
    record.expanded = !record.expanded;
  }

  goBack() {
    this.router.navigate(['/product-approval']);
  }
}
