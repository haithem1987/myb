import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project, ProjectStatus } from '../../../models/project.model';
import { Router, RouterModule } from '@angular/router';
import { CardComponent } from 'libs/shared/shared-ui/src';
import { ProjectService } from '../../../services/project.service';
import { ToastService } from 'libs/shared/infra/services/toast.service';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';

@Component({
  selector: 'myb-front-project-card',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss',
})
export class ProjectCardComponent implements OnInit {
  @Input() project!: Project;
  @Input() isArchived: boolean = false;
  @Output() edit: EventEmitter<Project> = new EventEmitter<Project>();
  @Output() delete: EventEmitter<number> = new EventEmitter<number>();
  canEdit = false;
  canDelete = false;

  constructor(
    private router: Router,
    private projectService: ProjectService,
    private toastService: ToastService,
    private keycloakService: KeycloakService
  ) {}

  ngOnInit(): void {
    this.canEdit = this.keycloakService.hasRole('PROJECT_RW');
    this.canDelete = this.keycloakService.hasRole('PROJECT_RW');
  }

  showTasks(project: Project): void {
    this.router.navigate(
      [`/timesheet/projects/${project.id}-${project.projectName}/tasks`],
      {
        state: { project },
      }
    );
  }

  editProject(project: Project): void {
    if (this.canEdit) {
      this.edit.emit(project);
    } else {
      this.toastService.show(
        'You do not have permission to edit this project',
        {
          classname: 'toast-success bg-danger text-light',
        }
      );
    }
  }

  deleteProject(id: number): void {
    if (this.canDelete) {
      this.delete.emit(id);
    } else {
      this.toastService.show(
        'You do not have permission to delete this project',
        {
          classname: 'bg-danger text-light',
        }
      );
    }
  }
  archiveProject(project: Project): void {
    if (confirm('Are you sure you want to archive this project?')) {
      const updatedProject = { ...project, status: 'ARCHIVED' };

      this.projectService
        .update(project.id, updatedProject)
        .subscribe((response) => {
          this.toastService.show('Project archived successfully!', {
            classname: '',
          });
        });
    }
  }

  restoreProject(project: Project): void {
    if (confirm('Are you sure you want to restore this project?')) {
      const updatedProject = { ...project, status: 'ACTIVE' };

      this.projectService.update(project.id, updatedProject).subscribe(() => {
        this.toastService.show('Project restored successfully!', {
          classname: '',
        });
      });
    }
  }
}
