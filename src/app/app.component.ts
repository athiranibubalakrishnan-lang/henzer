import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationStart, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { SidenavComponent } from './sidenav/sidenav.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, SidenavComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  menuOpen = false;
  isLoading = false;
  showHeader = true;

  constructor(private router: Router) {

    // ✅ FIX: Handle initial page load
    this.showHeader = !this.router.url.startsWith('/login');

    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.isLoading = true;
      } 
      else if (event instanceof NavigationEnd) {
        this.isLoading = false;

        // ✅ FIX: use urlAfterRedirects
        this.showHeader = !event.url.includes('/login');
      }
    });
  }

  toggleMenu(status: boolean) {
    this.menuOpen = status;
  }
}
