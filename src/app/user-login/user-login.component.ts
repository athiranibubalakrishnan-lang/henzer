import { Component, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.css']
})
export class UserLoginComponent {

  activeTab: 'login' | 'register' = 'login';

  // Login fields
  userEmail    = '';
  userPassword = '';
  showPassword = false;
  loading      = false;

  // Register fields
  regName      = '';
  regEmail     = '';
  regPassword  = '';
  regConfirm   = '';
  showRegPass  = false;
  showRegConf  = false;
  regLoading   = false;
  regError     = '';
  regSuccess   = '';

  constructor(private router: Router, private http: HttpClient, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {}

  login() {
    const payload = { email: this.userEmail, password: this.userPassword };
    this.loading = true;
    this.http.post<any>(`${environment.apiUrl}/api/auth/login`, payload).subscribe({
      next: (res) => {
        this.loading = false;
        if (res?.token) localStorage.setItem('token', res.token);

        let role: string;
        if (res?.role === 'USER' && res?.createdByAdmin === true) {
          role = 'PRIVILEGE_USER';
        } else {
          role = res?.role || 'USER';
        }
        localStorage.setItem('role', role);

        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/home';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        alert('Invalid credentials');
        this.cdr.markForCheck();
      }
    });
  }

  register() {
    this.regError   = '';
    this.regSuccess = '';

    if (!this.regName.trim() || !this.regEmail.trim() || !this.regPassword) {
      this.regError = 'All fields are required.';
      return;
    }
    if (this.regPassword !== this.regConfirm) {
      this.regError = 'Passwords do not match.';
      return;
    }
    if (this.regPassword.length < 6) {
      this.regError = 'Password must be at least 6 characters.';
      return;
    }

    const payload = {
      userName:       this.regName.trim(),
      email:          this.regEmail.trim(),
      password:       this.regPassword,
      role:           'USER',
      status:         'ACTIVE',
      createdByAdmin: false,
      addresses:      []
    };

    this.regLoading = true;
    this.http.post<any>(`${environment.apiUrl}/api/users`, payload).subscribe({
      next: () => {
        this.regLoading  = false;
        this.regSuccess  = 'Account created! You can now sign in.';
        this.regName     = '';
        this.regEmail    = '';
        this.regPassword = '';
        this.regConfirm  = '';
        this.cdr.markForCheck();
        setTimeout(() => {
          this.activeTab  = 'login';
          this.regSuccess = '';
          this.cdr.markForCheck();
        }, 2000);
      },
      error: (err) => {
        this.regLoading = false;
        if (err?.status === 409 || err?.error?.message?.toLowerCase().includes('exist') || err?.error?.toLowerCase?.()?.includes('exist')) {
          this.regError = 'Email ID already exists. Please sign in or use a different email.';
        } else {
          this.regError = this.extractError(err, 'Registration failed. Please try again.');
        }
        this.cdr.markForCheck();
      }
    });
  }

  /** Safely extracts a readable string from an HTTP error response */
  private extractError(err: any, fallback: string): string {
    const e = err?.error;
    if (!e) return fallback;
    if (typeof e === 'string') return e;
    if (typeof e === 'object') return e.message || e.error || e.detail || fallback;
    return fallback;
  }
}
