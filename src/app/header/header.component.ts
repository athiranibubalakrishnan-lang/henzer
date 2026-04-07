import { Component, EventEmitter, Output, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {

  @Output() menuToggle = new EventEmitter<boolean>();

  isMenuOpen = false;
  showDropdown = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.menuToggle.emit(this.isMenuOpen);
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
  }

  @HostListener('document:click')
  closeAll() {
    this.showDropdown = false;

    if (this.isMenuOpen) {
      this.isMenuOpen = false;
      this.menuToggle.emit(this.isMenuOpen);
    }
  }
}
