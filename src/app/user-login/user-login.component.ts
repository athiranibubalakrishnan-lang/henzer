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

  // Forgot password fields
  forgotStep: 'hidden' | 'email' | 'otp' = 'hidden';
  forgotEmail      = '';
  forgotOtp        = '';
  forgotNewPass    = '';
  forgotConfirm    = '';
  showForgotNew    = false;
  showForgotConf   = false;
  forgotLoading    = false;
  forgotError      = '';
  forgotSuccess    = '';

  constructor(private router: Router, private http: HttpClient, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {}

  login() {
    const payload = { email: this.userEmail, password: this.userPassword };
    this.loading = true;
    this.http.post<any>(`${environment.apiUrl}/api/auth/login`, payload).subscribe({
      next: (res) => {
        this.loading = false;
        this.handleLoginSuccess(res);
      },
      error: () => {
        // User login failed — try dealer login
        this.http.post<any>(`${environment.apiUrl}/api/auth/dealer/login`, payload).subscribe({
          next: (res) => {
            this.loading = false;
            this.handleDealerLoginSuccess(res);
          },
          error: () => {
            this.loading = false;
            alert('Invalid credentials');
            this.cdr.markForCheck();
          }
        });
      }
    });
  }

  private handleLoginSuccess(res: any) {
    if (res?.token) localStorage.setItem('token', res.token);
    if (res?.userName || res?.username) localStorage.setItem('userName', res.userName || res.username);
    if (res?.email || this.userEmail) localStorage.setItem('email', res?.email || this.userEmail);

    let role: string;
    if (res?.role === 'USER' && res?.createdByAdmin === true) {
      role = 'PRIVILEGE_USER';
    } else {
      role = res?.role || 'USER';
    }
    localStorage.setItem('role', role);

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/home';
    this.router.navigateByUrl(returnUrl);
  }

  private handleDealerLoginSuccess(res: any) {
    if (res?.token) localStorage.setItem('token', res.token);
    if (res?.userName || res?.username) localStorage.setItem('userName', res.userName || res.username);
    if (res?.email || this.userEmail) localStorage.setItem('email', res?.email || this.userEmail);

    const role = res?.role || 'DEALER';
    localStorage.setItem('role', role);

    // Store dealerId
    const dealerId = res?.userId ?? res?.id ?? res?.dealerId
      ?? res?.user?.id ?? res?.user?.dealerId ?? this.extractIdFromJwt(res?.token);
    if (dealerId) {
      localStorage.setItem('dealerId', String(dealerId));
    }

    this.router.navigate(['/home']);
  }

  private extractIdFromJwt(token: string | undefined): number | null {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.id ?? payload?.userId ?? payload?.dealerId ?? null;
    } catch {
      return null;
    }
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

  // ── Forgot Password ────────────────────────────────

  openForgotPassword() {
    this.forgotStep    = 'email';
    this.forgotEmail   = this.userEmail || '';
    this.forgotOtp     = '';
    this.forgotNewPass = '';
    this.forgotConfirm = '';
    this.forgotError   = '';
    this.forgotSuccess = '';
    this.cdr.markForCheck();
  }

  closeForgotPassword() {
    this.forgotStep = 'hidden';
    this.forgotError = '';
    this.forgotSuccess = '';
    this.cdr.markForCheck();
  }

  sendOtp() {
    this.forgotError = '';
    if (!this.forgotEmail.trim()) {
      this.forgotError = 'Please enter your email address.';
      return;
    }
    this.forgotLoading = true;
    this.http.post(
      `${environment.apiUrl}/api/auth/forgot-password/email/${encodeURIComponent(this.forgotEmail.trim())}`,
      null,
      { responseType: 'text' }
    ).subscribe({
      next: () => {
        this.forgotLoading = false;
        this.forgotSuccess = 'OTP has been sent to your registered email.';
        this.forgotStep = 'otp';
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.forgotLoading = false;
        this.forgotError = this.extractError(err, 'Failed to send OTP. Please try again.');
        this.cdr.markForCheck();
      }
    });
  }

  submitResetWithOtp() {
    this.forgotError   = '';
    this.forgotSuccess = '';
    if (!this.forgotOtp.trim()) {
      this.forgotError = 'Please enter the OTP.';
      return;
    }
    if (!this.forgotNewPass || this.forgotNewPass.length < 6) {
      this.forgotError = 'Password must be at least 6 characters.';
      return;
    }
    if (this.forgotNewPass !== this.forgotConfirm) {
      this.forgotError = 'Passwords do not match.';
      return;
    }
    this.forgotLoading = true;
    this.http.post(
      `${environment.apiUrl}/api/auth/reset-password`,
      { email: this.forgotEmail.trim(), otp: this.forgotOtp.trim(), newPassword: this.forgotNewPass }
    ).subscribe({
      next: () => {
        this.forgotLoading = false;
        this.forgotSuccess = 'Password reset successful! You can now sign in.';
        this.cdr.markForCheck();
        setTimeout(() => {
          this.closeForgotPassword();
          this.cdr.markForCheck();
        }, 2500);
      },
      error: (err) => {
        this.forgotLoading = false;
        this.forgotError = this.extractError(err, 'Failed to reset password. Please check OTP and try again.');
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
