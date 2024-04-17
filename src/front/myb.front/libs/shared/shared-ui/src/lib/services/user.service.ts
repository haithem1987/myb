import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { RepositoryService } from './repository.service';

@Injectable({
  providedIn: 'root',
})
export class UserService extends RepositoryService<User> {
   
}
