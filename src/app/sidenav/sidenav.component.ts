import { Component, Input,Output,EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css']
})
export class SidenavComponent {

  @Input() isOpen: boolean = false;
   @Output() close = new EventEmitter<void>();

  menuItems = [
    { name: 'Dashboard', icon: '🏠' },
    { name: 'Products', icon: '📦' },
    { name: 'Orders', icon: '🧾' },
    { name: 'Customers', icon: '👥' },
    { name: 'Reports', icon: '📊' },
    { name: 'Settings', icon: '⚙️' }
  ];

 closeMenu() {
    this.close.emit();
  }
}
