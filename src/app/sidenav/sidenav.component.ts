import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css']
})
export class SidenavComponent {

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  constructor(private router: Router) {}

  get isAdmin(): boolean {
    return localStorage.getItem('role') === 'ADMIN';
  }

  get isUser(): boolean {
    const role = localStorage.getItem('role');
    return role !== 'ADMIN' && role !== 'DEALER';
  }

  get isGuest(): boolean {
    return !localStorage.getItem('token');
  }

  navigate(path: string) {
    this.closeMenu();
    this.router.navigate([path]);
  }

  logout() {
    const role = localStorage.getItem('role');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    this.closeMenu();
    if (role === 'ADMIN' || role === 'DEALER') {
      this.router.navigate(['/adminlogin']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  closeMenu() {
    this.close.emit();
  }
}
