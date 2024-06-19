import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectListComponent } from '../list/project-list.component';
import { Project, ProjectStatus } from '../../../models/project.model';
import { ProjectService } from '../../../services/project.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'myb-front-project-tabs',
  standalone: true,
  imports: [CommonModule, ProjectListComponent],
  templateUrl: './project-tabs.component.html',
  styleUrls: ['./project-tabs.component.css'],
})
export class ProjectTabsComponent {
  activeTab: string = 'ACTIVE';
  activeProjects$: Observable<Project[]> = this.projectService.activeProjects$;
  archivedProjects$: Observable<Project[]> =
    this.projectService.archivedProjects$;

  constructor(private projectService: ProjectService) {}
  setActiveTab(tab: 'ACTIVE' | 'ARCHIVED') {
    this.activeTab = tab;
  }
}
