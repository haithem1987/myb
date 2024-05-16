import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectListComponent } from '../list/project-list.component';

@Component({
  selector: 'myb-front-project-index',
  standalone: true,
  imports: [CommonModule, ProjectListComponent],
  templateUrl: './project-index.component.html',
  styleUrl: './project-index.component.css',
})
export class ProjectIndexComponent {}
