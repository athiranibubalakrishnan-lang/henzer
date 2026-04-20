import { Component } from '@angular/core';
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

  userEmail = 'user@henzeronline.com';
  userPassword = 'test123';
  showPassword = false;
  loading = false;

  constructor(private router: Router, private http: HttpClient, private route: ActivatedRoute) {}

  login() {
    const payload = { email: this.userEmail, password: this.userPassword };
    this.loading = true;
    this.http.post<any>(`${environment.apiUrl}/api/auth/login`, payload).subscribe({
      next: (res) => {
        this.loading = false;
        if (res?.token) localStorage.setItem('token', res.token);
        localStorage.setItem('role', res?.role || 'USER');
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/shop';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        alert('Invalid credentials');
      }
    });
  }
}
