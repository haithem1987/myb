import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../../models/project.model';
import { RouterModule } from '@angular/router';
import { CardComponent } from 'libs/shared/shared-ui/src';

@Component({
  selector: 'myb-front-project-card',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss',
})
export class ProjectCardComponent {
  @Input() project!: Project;
  @Output() edit: EventEmitter<Project> = new EventEmitter<Project>();
  @Output() delete: EventEmitter<number> = new EventEmitter<number>();

  editProject(project: Project): void {
    this.edit.emit(project);
  }
  deleteProject(id: number): void {
    this.delete.emit(id);
  }
}
