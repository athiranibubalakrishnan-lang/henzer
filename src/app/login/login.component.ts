import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  // Admin login
  adminEmail = '';
  adminPassword = '';
  showAdminPassword = false;
  adminLoading = false;

  // Dealer login
  dealerEmail = '';
  dealerPassword = '';
  showDealerPassword = false;
  dealerLoading = false;

  constructor(private router: Router, private http: HttpClient) {}

  adminLogin() {
    const payload = { email: this.adminEmail, password: this.adminPassword };
    this.adminLoading = true;
    this.http.post<any>('http://localhost:8080/api/auth/admin/login', payload).subscribe({
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
    this.http.post<any>('http://localhost:8080/api/auth/dealer/login', payload).subscribe({
      next: (res) => {
        this.dealerLoading = false;
        if (res?.token) localStorage.setItem('token', res.token);
        localStorage.setItem('role', res?.role || 'DEALER');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.dealerLoading = false;
        console.error(err);
        alert('Invalid dealer credentials');
      }
    });
  }
}
