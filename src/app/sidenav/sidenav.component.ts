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

  navigate(path: string) {
    this.closeMenu();
    this.router.navigate([path]);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    this.closeMenu();
    this.router.navigate(['/login']);
  }

  closeMenu() {
    this.close.emit();
  }
}
