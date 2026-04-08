import { Component, EventEmitter, Output, HostListener, NgZone } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

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

  constructor(private router: Router, private zone: NgZone) {}

  get isAdmin(): boolean {
    return localStorage.getItem('role') === 'ADMIN';
  }

  get userInitial(): string {
    const role = localStorage.getItem('role') || 'A';
    return role.charAt(0).toUpperCase();
  }

  get userName(): string {
    const role = localStorage.getItem('role') || '';
    if (role === 'ADMIN') return 'Admin';
    if (role === 'DEALER') return 'Dealer';
    if (role === 'PRIVILEGE_USER') return 'User';
    return role;
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

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    this.router.navigate(['/login']);
  }

  @HostListener('document:click')
  closeAll() {
    this.zone.run(() => {
      this.showDropdown = false;
    });
  }
}
