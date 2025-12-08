import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'myb-front-custom-styles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-styles.component.html',
  styleUrl: './custom-styles.component.css',
})
export class CustomStylesComponent {}
