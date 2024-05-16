import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../../models/project.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'myb-front-project-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss',
})
export class ProjectCardComponent {
  @Input() project!: Project;
  @Output() delete: EventEmitter<number> = new EventEmitter<number>();

  deleteProject(id: number): void {
    this.delete.emit(id);
  }
}
