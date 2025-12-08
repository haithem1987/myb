import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectListComponent } from '../list/project-list.component';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'myb-front-project-index',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './project-index.component.html',
  styleUrl: './project-index.component.css',
})
export class ProjectIndexComponent {}
