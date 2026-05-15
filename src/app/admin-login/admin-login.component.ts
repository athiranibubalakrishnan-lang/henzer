import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css']
})
export class AdminLoginComponent {

  adminEmail = 'vivekk@gmail.com';
  adminPassword = 'Password@1234';
  showAdminPassword = false;
  adminLoading = false;

  dealerEmail = '';
  dealerPassword = '';
  showDealerPassword = false;
  dealerLoading = false;

  constructor(private router: Router, private http: HttpClient) {}

  adminLogin() {
    const payload = { email: this.adminEmail, password: this.adminPassword };
    this.adminLoading = true;
    this.http.post<any>(`${environment.apiUrl}/api/auth/admin/login`, payload).subscribe({
      next: (res) => {
        this.adminLoading = false;
        if (res?.token) localStorage.setItem('token', res.token);
        localStorage.setItem('role', res?.role || 'ADMIN');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.adminLoading = false;
        console.error(err);
        alert('Invalid admin credentials');
      }
    });
  }

  dealerLogin() {
    const payload = { email: this.dealerEmail, password: this.dealerPassword };
    this.dealerLoading = true;
    this.http.post<any>(`${environment.apiUrl}/api/auth/dealer/login`, payload).subscribe({
      next: (res) => {
        this.dealerLoading = false;
        if (res?.token) localStorage.setItem('token', res.token);
        localStorage.setItem('role', res?.role || 'DEALER');

        // Try every common field name the backend might use for the dealer's numeric ID
        const dealerId = res?.userId
          ?? res?.id
          ?? res?.dealerId
          ?? res?.user?.id
          ?? res?.user?.dealerId
          ?? this.extractIdFromJwt(res?.token);

        if (dealerId) {
          localStorage.setItem('dealerId', String(dealerId));
        } else {
          // Log the full response so the field name can be identified
          console.warn('dealerId not found in login response. Full response:', res);
        }

        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.dealerLoading = false;
        console.error(err);
        alert('Invalid dealer credentials');
      }
    });
  }

  /** Decode the JWT payload and extract an id/userId/dealerId claim */
  private extractIdFromJwt(token: string | undefined): number | null {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.id ?? payload?.userId ?? payload?.dealerId ?? null;
    } catch {
      return null;
    }
  }
}
