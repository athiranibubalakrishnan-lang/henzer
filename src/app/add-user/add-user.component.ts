import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { UserService, User } from '../user.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css']
})
export class AddUserComponent implements OnInit {

  user: User & { customerGroupId?: number } = { userName: '', email: '', role: '', status: 'ACTIVE', password: '' };
  loading = false;
  toast = '';
  customerGroups: any[] = [];
  selectedRole = ''; // holds either 'DEALER' or a group id

  constructor(private userService: UserService, private router: Router, private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/api/customer-groups`).subscribe({
      next: (data) => this.customerGroups = Array.isArray(data) ? data : [],
      error: () => {}
    });
  }

  onRoleChange(value: string) {
    if (value === 'DEALER') {
      this.user.role = 'DEALER';
      this.user.customerGroupId = undefined;
    } else {
      // value is a group id
      const group = this.customerGroups.find(g => g.id == value);
      this.user.role = group?.groupName || '';
      this.user.customerGroupId = +value;
    }
  }

  get showCustomerGroup(): boolean {
    return false;
  }

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
