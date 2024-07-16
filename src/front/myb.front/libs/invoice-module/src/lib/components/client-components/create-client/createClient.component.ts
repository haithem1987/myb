import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'myb-front-create-client',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './createClient.component.html',
  styleUrl: './createClient.component.css',
})
export class CreateClientComponent {
  clientForm: FormGroup = new FormGroup({
    firstName : new FormControl(''),
    lastName : new FormControl(''),
    clientAddress : new FormControl(''),
  })
}
