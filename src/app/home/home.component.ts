import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewChild, ElementRef } from '@angular/core';
// import { HttpClient } from '@angular/common/http'; // 🔌 API (for future)

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {

  // constructor(private http: HttpClient) {} // 🔌 enable later

  images = [
    'assets/banner1.jpg',
    'assets/banner2.jpg',
    'assets/banner3.jpg'
  ];

  currentIndex = 0;

  ngOnInit() {
    setInterval(() => {
      this.nextSlide();
    }, 3000);

    // 🔌 API CALLS (COMMENTED FOR NOW)

    /*
    this.http.get('http://localhost:8080/api/products/top-rated')
      .subscribe((data: any) => {
        this.topRatedProducts = data;
      });

    this.http.get('http://localhost:8080/api/products/all')
      .subscribe((data: any) => {
        this.browseAllProducts = data;
      });
    */
  }

  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }

  prevSlide() {
    this.currentIndex =
      (this.currentIndex - 1 + this.images.length) % this.images.length;
  }

  // ⭐ TOP RATED (Dummy)
  topRatedProducts = [
    { brand: 'HENZER', name: 'Huawei P20 Lite Org', price: 54.00 },
    { brand: 'HENZER', name: 'Samsung G570', price: 48.00 },
    { brand: 'HENZER', name: 'Samsung J810', price: 203.00 },
    { brand: 'HENZER', name: 'iPhone XR FOG', price: 107.00 },
    { brand: 'SILICA', name: 'iPhone XR FHD', price: 71.00 }
  ];

  // 🛍️ BROWSE ALL (Dummy)
  browseAllProducts = [
    { brand: 'HENZER', name: 'iPhone XR FOG', price: 107.00 },
    { brand: 'HENZER', name: 'iPhone XS MAX OLED', price: 217.00 },
    { brand: 'HENZER', name: 'iPhone XS OLED', price: 161.00 },
    { brand: 'SILICA', name: 'iPhone XR FHD', price: 71.00 }
  ];
  @ViewChild('scrollContainer', { static: false })
scrollContainer!: ElementRef;

scrollLeft() {
  this.scrollContainer.nativeElement.scrollBy({
    left: -200,
    behavior: 'smooth'
  });
}

scrollRight() {
  this.scrollContainer.nativeElement.scrollBy({
    left: 200,
    behavior: 'smooth'
  });
}
}




