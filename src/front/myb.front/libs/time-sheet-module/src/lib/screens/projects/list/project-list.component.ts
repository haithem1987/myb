import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../../models/project.model';
import { ProjectService } from '../../../services/project.service';
import { ProjectCardComponent } from '../card/project-card.component';

@Component({
  selector: 'myb-front-project-list',
  standalone: true,
  imports: [CommonModule, ProjectCardComponent],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.css',
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.projectService.getAll().subscribe((projects) => {
      this.projects = projects;
    });
  }

  addProject(): void {
    const newProject: Project = {
      id: 0,
      projectName: 'New Project',
      description: 'Description',
      startDate: new Date(),
      endDate: new Date(),
      userId: 'currentUserId',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projectService.create(newProject).subscribe(() => {
      this.loadProjects();
    });
  }

  updateProject(updatedProject: Project): void {
    this.projectService
      .update(updatedProject.id, updatedProject)
      .subscribe(() => {
        this.loadProjects();
      });
  }

  deleteProject(projectId: number): void {
    this.projectService.delete(projectId).subscribe(() => {
      this.loadProjects();
    });
  }
}
