import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { RepositoryService } from './repository.service';
import { Apollo } from 'apollo-angular';

@Injectable({
  providedIn: 'root',
})
export class UserService extends RepositoryService<User> {
  constructor(apollo: Apollo) {
    console.log('apollo', apollo);
    super(apollo, 'User'); // 'user' should match the key in your typeConfig for user operations
  }
}
