import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Project, ProjectStatus } from '../../../models/project.model';
import { ProjectService } from '../../../services/project.service';
import { ProjectCardComponent } from '../card/project-card.component';
import { Observable, map } from 'rxjs';
import { ToastService } from 'libs/shared/infra/services/toast.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'myb-front-project-list',
  standalone: true,
  imports: [CommonModule, ProjectCardComponent, TranslateModule],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css'],
})
export class ProjectListComponent implements OnInit {
  @Input() isArchived: boolean = false;
  @Input() projects?: Observable<Project[]>;

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
    console.log('emit editProject', project);
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
