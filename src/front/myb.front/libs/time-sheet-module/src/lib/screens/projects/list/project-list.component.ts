import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Project } from '../../../models/project.model';
import { ProjectService } from '../../../services/project.service';
import { ProjectCardComponent } from '../card/project-card.component';
import { ToastService } from 'libs/shared/shared-ui/src/lib/services/toast.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'myb-front-project-list',
  standalone: true,
  imports: [CommonModule, ProjectCardComponent],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css'],
})
export class ProjectListComponent implements OnInit {
  projects$: Observable<Project[]> = this.projectService.projects$;

  constructor(
    private projectService: ProjectService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {}

  addProject(): void {
    this.router.navigate(['/timesheet/projects/new']);
  }

  editProject(project: Project): void {
    this.router.navigate(['/timesheet/projects/edit', project.id], {
      state: { project },
    });
  }

  deleteProject(projectId: number): void {
    this.projectService.delete(projectId).subscribe((success) => {
      if (success) {
        this.toastService.show('Project deleted successfully!', {
          classname: '',
        });
      }
    });
  }
}
