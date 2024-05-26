import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Project } from '../../../models/project.model';
import { ProjectService } from '../../../services/project.service';
import { ProjectCardComponent } from '../card/project-card.component';
import { ToastService } from 'libs/shared/infra/services/toast.service';

@Component({
  selector: 'myb-front-project-list',
  standalone: true,
  imports: [CommonModule, ProjectCardComponent],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css'],
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];

  constructor(
    private projectService: ProjectService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.projectService.getAll().subscribe((projects) => {
      this.projects = projects;
    });
  }

  addProject(): void {
    this.router.navigate(['/timesheet/projects/new']);
  }

  editProject(project: Project): void {
    this.router.navigate(['/timesheet/projects/edit', project.id], {
      state: { project },
    });
  }

  deleteProject(projectId: number): void {
    this.projectService.delete(projectId).subscribe(() => {
      this.toastService.show('Project deleted successfully!', {
        classname: 'border border-success bg-success text-light',
      });
      this.loadProjects();
    });
  }
}
