import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'myb-front-list-product',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './listProduct.component.html',
  styleUrl: './listProduct.component.css',
})
export class ListProductComponent {}
