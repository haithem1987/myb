import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'myb-front-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.css',
})
export class LoaderComponent {}
