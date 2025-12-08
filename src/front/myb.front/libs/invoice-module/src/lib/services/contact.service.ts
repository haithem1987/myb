import { Injectable } from '@angular/core';
import { Contact } from '../models/contact.model';
import { BehaviorSubject, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  
  private contactSubject = new BehaviorSubject<Contact[]>([]);
  public contacts$ = this.contactSubject.asObservable();

  constructor() {
  
  }

}
