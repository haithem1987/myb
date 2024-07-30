import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { ContactService } from '../../../services/contact.service';

@Component({
  selector: 'myb-front-client',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  templateUrl: './client.component.html',
  styleUrl: './client.component.css',
})
export class ClientComponent {
 
}
