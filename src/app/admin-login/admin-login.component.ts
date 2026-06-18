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

  email    = '';
  password = '';
  showPassword = false;
  loading  = false;
  errorMsg = '';

  constructor(private router: Router, private http: HttpClient) {}

  login() {
    if (!this.email || !this.password) {
      this.errorMsg = 'Please enter your email and password.';
      return;
    }
    this.errorMsg = '';
    this.loading  = true;

    const payload = { email: this.email, password: this.password };

    // Admin login only
    this.http.post<any>(`${environment.apiUrl}/api/auth/admin/login`, payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.handleSuccess(res, 'ADMIN');
      },
      error: () => {
        this.loading  = false;
        this.errorMsg = 'Invalid email or password.';
      }
    });
  }

  private handleSuccess(res: any, fallbackRole: string) {
    if (res?.token) localStorage.setItem('token', res.token);
    if (res?.email || this.email) localStorage.setItem('email', res?.email || this.email);
    if (res?.userName || res?.username) localStorage.setItem('userName', res.userName || res.username);

    const role = res?.role || fallbackRole;
    localStorage.setItem('role', role);

    if (role === 'DEALER') {
      const dealerId = res?.userId
        ?? res?.id
        ?? res?.dealerId
        ?? res?.user?.id
        ?? res?.user?.dealerId
        ?? this.extractIdFromJwt(res?.token);

      if (dealerId) {
        localStorage.setItem('dealerId', String(dealerId));
      } else {
        console.warn('dealerId not found in login response. Full response:', res);
      }
    }

    this.router.navigate(['/home']);
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
