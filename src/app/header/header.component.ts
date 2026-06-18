import { Component, EventEmitter, Output, HostListener, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {

  @Output() menuToggle = new EventEmitter<boolean>();

  isMenuOpen = false;
  showDropdown = false;
  showBrandDropdown = false;
  showViewProductsDropdown = false;
  showAdminDropdown = false;
  showReviewDropdown = false;

  constructor(private router: Router, private cdr: ChangeDetectorRef, public cartService: CartService) {}

  get isAdmin(): boolean {
    return localStorage.getItem('role') === 'ADMIN';
  }

  get isDealer(): boolean {
    return localStorage.getItem('role') === 'DEALER';
  }

  get isUser(): boolean {
    return localStorage.getItem('role') === 'USER' || localStorage.getItem('role') === 'PRIVILEGE_USER';
  }

  get isGuest(): boolean {
    return !localStorage.getItem('token');
  }

  get userInitial(): string {
    const name = localStorage.getItem('userName');
    if (name) return name.charAt(0).toUpperCase();
    const role = localStorage.getItem('role') || 'A';
    return role.charAt(0).toUpperCase();
  }

  get userName(): string {
    const name = localStorage.getItem('userName');
    if (name) return name;
    const role = localStorage.getItem('role') || '';
    if (role === 'ADMIN') return 'Admin';
    if (role === 'DEALER') return 'Dealer';
    return 'User';
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
    this.menuToggle.emit(this.isMenuOpen);
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
  }

  toggleBrandDropdown(event: Event) {
    event.stopPropagation();
    this.showBrandDropdown = !this.showBrandDropdown;
  }

  toggleViewProductsDropdown(event: Event) {
    event.stopPropagation();
    this.showViewProductsDropdown = !this.showViewProductsDropdown;
  }

  toggleAdminDropdown(event: Event) {
    event.stopPropagation();
    this.showAdminDropdown = !this.showAdminDropdown;
  }

  toggleReviewDropdown(event: Event) {
    event.stopPropagation();
    this.showReviewDropdown = !this.showReviewDropdown;
  }

  logout() {
    const role = localStorage.getItem('role');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    localStorage.removeItem('email');
    localStorage.removeItem('dealerId');
    if (role === 'ADMIN' || role === 'DEALER') {
      this.router.navigate(['/adminlogin']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  @HostListener('document:click')
  closeAll() {
    this.showDropdown = false;
    this.showBrandDropdown = false;
    this.showViewProductsDropdown = false;
    this.showAdminDropdown = false;
    this.showReviewDropdown = false;
    this.cdr.markForCheck();
  }
}
