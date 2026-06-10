import { Component, ViewChild, ElementRef, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnDestroy {

  private slideInterval: any;

  constructor(private router: Router, private cdr: ChangeDetectorRef, private cartService: CartService) {}

  get isUser(): boolean {
    const role = localStorage.getItem('role');
    return role !== 'ADMIN' && role !== 'DEALER';
  }

  toast = '';
  showToast(msg: string) {
    this.toast = msg;
    setTimeout(() => this.toast = '', 2000);
  }

  images = [
    'assets/quality-banner.png',
    'assets/quality-banner2.jpg'
  ];

  currentIndex = 0;

  ngOnInit() {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
      this.cdr.markForCheck();
    }, 3000);
  }

  ngOnDestroy() {
    clearInterval(this.slideInterval);
  }

  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }

  prevSlide() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
  }

  topRatedProducts = [
    { brand: 'HENZER', name: 'Huawei P20 Lite Org', price: 54.00 },
    { brand: 'HENZER', name: 'Samsung G570', price: 48.00 },
    { brand: 'HENZER', name: 'Samsung J810', price: 203.00 },
    { brand: 'HENZER', name: 'iPhone XR FOG', price: 107.00 },
    { brand: 'SILICA', name: 'iPhone XR FHD', price: 71.00 }
  ];

  browseAllProducts = [
    { brand: 'HENZER', name: 'iPhone XR FOG', price: 107.00 },
    { brand: 'HENZER', name: 'iPhone XS MAX OLED', price: 217.00 },
    { brand: 'HENZER', name: 'iPhone XS OLED', price: 161.00 },
    { brand: 'SILICA', name: 'iPhone XR FHD', price: 71.00 }
  ];

  @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef;

  scrollLeft() {
    this.scrollContainer.nativeElement.scrollBy({ left: -200, behavior: 'smooth' });
  }

  scrollRight() {
    this.scrollContainer.nativeElement.scrollBy({ left: 200, behavior: 'smooth' });
  }

  goToAddProduct(p: any) {
    if (this.isUser) {
      this.router.navigate(['/view-products']);
    } else {
      this.router.navigate(['/add-product'], {
        queryParams: { name: p.name, brand: p.brand, price: p.price }
      });
    }
  }
}




