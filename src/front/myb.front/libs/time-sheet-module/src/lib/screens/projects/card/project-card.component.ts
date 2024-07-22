import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project, ProjectStatus } from '../../../models/project.model';
import { Router, RouterModule } from '@angular/router';
import { CardComponent } from 'libs/shared/shared-ui/src';
import { ProjectService } from '../../../services/project.service';
import { ToastService } from 'libs/shared/infra/services/toast.service';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'myb-front-project-card',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, TranslateModule],
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
    private keycloakService: KeycloakService,
    private translate: TranslateService
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
      this.router.navigate(['/timesheet/projects/edit', project.id], {
        state: { project },
      });
      // this.edit.emit(project);
    } else {
      this.translate.get('NO_PERMISSION_EDIT').subscribe((res: string) => {
        this.toastService.show(res, {
          classname: 'toast-success',
        });
      });
    }
  }

  deleteProject(id: number): void {
    if (this.canDelete) {
      this.delete.emit(id);
    } else {
      this.translate.get('NO_PERMISSION_DELETE').subscribe((res: string) => {
        this.toastService.show(res, {
          classname: 'toast-success',
        });
      });
    }
  }

  archiveProject(project: Project): void {
    this.translate.get('CONFIRM_ARCHIVE_PROJECT').subscribe((res: string) => {
      if (confirm(res)) {
        const updatedProject = { ...project, status: 'ARCHIVED' };

        this.projectService
          .update(project.id, updatedProject)
          .subscribe((response) => {
            this.translate
              .get('PROJECT_ARCHIVED_SUCCESS')
              .subscribe((msg: string) => {
                this.toastService.show(msg, {
                  classname: 'toast-success',
                });
              });
          });
      }
    });
  }

  restoreProject(project: Project): void {
    this.translate.get('CONFIRM_RESTORE_PROJECT').subscribe((res: string) => {
      if (confirm(res)) {
        const updatedProject = { ...project, status: 'ACTIVE' };

        this.projectService.update(project.id, updatedProject).subscribe(() => {
          this.translate
            .get('PROJECT_RESTORED_SUCCESS')
            .subscribe((msg: string) => {
              this.toastService.show(msg, {
                classname: '',
              });
            });
        });
      }
    });
  }
}
