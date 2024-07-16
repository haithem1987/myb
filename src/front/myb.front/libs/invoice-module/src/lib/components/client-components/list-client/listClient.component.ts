import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ClientCardComponent } from '../client-card/clientCard.component';

@Component({
  selector: 'myb-front-list-client',
  standalone: true,
  imports: [CommonModule, RouterLink, ClientCardComponent],
  templateUrl: './listClient.component.html',
  styleUrl: './listClient.component.css',
})
export class ListClientComponent {}
