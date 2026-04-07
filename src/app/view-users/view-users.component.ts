import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../user.service';

@Component({
  selector: 'app-view-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './view-users.component.html',
  styleUrls: ['./view-users.component.css']
})
export class ViewUsersComponent {

  searchText = '';
  users: User[] = [];

  constructor(private userService: UserService) {
    this.users = this.userService.getUsers();
  }

  deleteUser(i: number) {
    this.userService.deleteUser(i);
    this.users = this.userService.getUsers();
  }

  get filteredUsers(): User[] {
    return this.users.filter(u =>
      !this.searchText ||
      u.userName.toLowerCase().includes(this.searchText.toLowerCase()) ||
      u.email.toLowerCase().includes(this.searchText.toLowerCase()) ||
      u.role.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }
}
