import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService, User } from '../user.service';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css']
})
export class AddUserComponent {

  user: User = { userName: '', email: '', role: '', status: 'ACTIVE', password: '' };
  loading = false;
  toast = '';

  constructor(private userService: UserService, private router: Router) {}

  showToast(msg: string) {
    this.toast = msg;
    setTimeout(() => this.toast = '', 3000);
  }

  addUser(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.userService.create(this.user).subscribe({
      next: () => {
        this.loading = false;
        this.showToast('User created successfully!');
        this.resetForm(form);
        setTimeout(() => this.router.navigate(['/view-users']), 1500);
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        this.showToast('Failed to create user');
      }
    });
  }

  resetForm(form?: NgForm) {
    this.user = { userName: '', email: '', role: '', status: 'ACTIVE', password: '' };
    form?.resetForm(this.user);
  }
}
