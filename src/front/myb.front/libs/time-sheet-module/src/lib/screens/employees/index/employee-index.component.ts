import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'myb-front-employee-index',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './employee-index.component.html',
  styleUrl: './employee-index.component.css',
})
export class EmployeeIndexComponent {}
