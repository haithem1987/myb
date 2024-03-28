import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'myb-front-module-ui',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './module-ui.component.html',
  styleUrl: './module-ui.component.css',
})
export class ModuleUiComponent {}
