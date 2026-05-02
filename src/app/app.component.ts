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

  private isLoginPage(url: string): boolean {
    return url.includes('/login') || url.includes('/userlogin') || url.includes('/adminlogin');
  }

  constructor(private router: Router) {
    this.showHeader = !this.isLoginPage(this.router.url);

    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.isLoading = true;
      } else if (event instanceof NavigationEnd) {
        this.isLoading = false;
        this.showHeader = !this.isLoginPage(event.url);
      }
    });
  }

  toggleMenu(status: boolean) {
    this.menuOpen = status;
  }
}
