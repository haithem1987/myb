import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'myb-front-tax',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './tax.component.html',
  styleUrl: './tax.component.css',
})
export class TaxComponent {}
