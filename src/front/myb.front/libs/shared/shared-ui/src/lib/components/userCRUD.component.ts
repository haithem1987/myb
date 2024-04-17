import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../models/user.model';
import { UserService } from '../services/user.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'myb-front-user-crud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './userCRUD.component.html',
  styleUrl: './userCRUD.component.css',
})
export class UserCRUDComponent implements OnInit {
  users: User[] = [];
  selectedUser: User | null = null;
  newUser: User = { id: 0, name: '', email: '' };
  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getAll().subscribe((users) => {
      this.users = users;
    });
  }

  selectUser(user: User): void {
    this.selectedUser = { ...user };
  }

  saveUser(): void {
    if (this.selectedUser) {
      this.userService
        .update(this.selectedUser.id, this.selectedUser)
        .subscribe((user) => {
          this.loadUsers();
          this.cancel();
        });
    }
  }

  createUser(): void {
    this.userService.create(this.newUser).subscribe((user) => {
      // this.users.push(user);
      this.newUser = { id: 0, name: '', email: '' }; // Reset new user form
    });
  }

  deleteUser(id: number): void {
    this.userService.delete(id).subscribe(() => {
      this.users = this.users.filter((user) => user.id !== id);
    });
  }
  cancel(): void {
    this.selectedUser = null;
  }
}
