import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../user.service';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css']
})
export class AddUserComponent {

  user: User = {
    userName: '',
    email: '',
    role: 'ADMIN',
    status: 'ACTIVE'
  };

  constructor(private userService: UserService) {}

  addUser(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    // Add to in-memory UserService
    this.userService.addUser({ ...this.user });
    alert('User added successfully!');
    this.resetForm(form);
  }

  resetForm(form?: NgForm) {
    this.user = {
      userName: '',
      email: '',
      role: 'ADMIN',
      status: 'ACTIVE'
    };
    form?.resetForm(this.user);
  }
}
