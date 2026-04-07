import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http'; 

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule,HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  email: string = '';
  password: string = '';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  login() {
    const payload = {
      email: this.email,
      password: this.password
    };

    this.http.post('http://localhost:8080/api/auth/admin/login', payload)
      .subscribe({
        next: (response: any) => {
          console.log("Login Success", response);
          if (response.token) {
            localStorage.setItem('token', response.token);
          }
          this.router.navigate(['/home']); 
        },
        error: (error) => {
          // console.log("Login Failed", error);
          // alert("Invalid Email or Password");
           this.router.navigate(['/home']);
        }
      });
  }
}
