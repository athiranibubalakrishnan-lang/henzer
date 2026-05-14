import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { UserService, User } from '../user.service';
import { environment } from '../../environments/environment';

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css']
})
export class AddUserComponent implements OnInit {

  user: User & { customerGroupId?: number; addresses?: Address[] } = {
    userName: '',
    email: '',
    role: '',
    status: 'ACTIVE',
    password: '',
    addresses: []
  };

  // Single address entry (added to the list on submit)
  address: Address = { street: '', city: '', state: '', pincode: '', country: '' };

  loading = false;
  toast = '';
  customerGroups: any[] = [];
  groupsLoading = false;

  constructor(
    private userService: UserService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.groupsLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}/api/customer-groups`).subscribe({
      next: (data) => {
        this.groupsLoading = false;
        this.customerGroups = Array.isArray(data) ? data : [];
      },
      error: () => { this.groupsLoading = false; }
    });
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

    // Include address if any field is filled
    const hasAddress = Object.values(this.address).some(v => v.trim() !== '');
    const payload = {
      ...this.user,
      addresses: hasAddress ? [this.address] : []
    };

    this.userService.create(payload).subscribe({
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
    this.user = { userName: '', email: '', role: '', status: 'ACTIVE', password: '', addresses: [] };
    this.address = { street: '', city: '', state: '', pincode: '', country: '' };
    form?.resetForm(this.user);
  }
}
