import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '@myb-front/shared-ui';

@Component({
  selector: 'myb-front-client-card',
  standalone: true,
  imports: [CommonModule,CardComponent],
  templateUrl: './clientCard.component.html',
  styleUrl: './clientCard.component.css',
})
export class ClientCardComponent {}
