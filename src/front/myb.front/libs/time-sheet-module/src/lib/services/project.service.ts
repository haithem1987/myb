import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Project } from '../models/project.model';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { RepositoryService } from 'libs/shared/infra/services/repository.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectService extends RepositoryService<Project> {
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  public projects$ = this.projectsSubject.asObservable();
  private activeProjectsSubject = new BehaviorSubject<Project[]>([]);
  private archivedProjectsSubject = new BehaviorSubject<Project[]>([]);
  public activeProjects$ = this.activeProjectsSubject.asObservable();
  public archivedProjects$ = this.archivedProjectsSubject.asObservable();

  constructor(apollo: Apollo) {
    super(apollo, 'Project', 'timesheetService');
    this.loadInitialProjects();
  }

  private loadInitialProjects(): void {
    this.getAll().subscribe((projects) => {
      this.projectsSubject.next(projects);
      this.updateActiveAndArchivedProjects(projects);
    });
  }

  private updateActiveAndArchivedProjects(projects: Project[]): void {
    const activeProjects = projects.filter(
      (project) => project.status === 'ACTIVE'
    );
    const archivedProjects = projects.filter(
      (project) => project.status === 'ARCHIVED'
    );
    this.activeProjectsSubject.next(activeProjects);
    this.archivedProjectsSubject.next(archivedProjects);
  }

  protected override mapAllItems(result: any): Project[] {
    return result.data?.allProjects || [];
  }

  protected override mapSingleItem(result: any): Project {
    return result.data?.projectById as Project;
  }

  protected override mapCreateItem(result: any): Project {
    return result.data?.addProject as Project;
  }

  protected override mapUpdateItem(result: any): Project {
    return result.data?.updateProject as Project;
  }

  protected override mapDeleteResult(result: any): boolean {
    return result.data?.deleteProject === true;
  }

  override getAll(): Observable<Project[]> {
    return super.getAll().pipe(
      map((projects) => {
        this.projectsSubject.next(projects);
        this.updateActiveAndArchivedProjects(projects);
        return projects;
      })
    );
  }

  override get(id: number): Observable<Project> {
    return super.get(id).pipe(
      map((project) => {
        const projects = this.projectsSubject.value.map((p) =>
          p.id === id ? project : p
        );
        const activeProjects = this.activeProjectsSubject.value.map((p) =>
          p.id === id ? project : p
        );
        const archivedProjects = this.archivedProjectsSubject.value.map((p) =>
          p.id === id ? project : p
        );
        this.projectsSubject.next(projects);
        this.activeProjectsSubject.next(activeProjects);
        this.archivedProjectsSubject.next(activeProjects);
        // this.updateActiveAndArchivedProjects(projects);
        return project;
      })
    );
  }

  override create(item: Project): Observable<Project> {
    return super.create(item).pipe(
      map((newProject) => {
        // const projects = [...this.projectsSubject.value, newProject];
        const activeProjects = [
          ...this.activeProjectsSubject.value,
          newProject,
        ];
        // this.projectsSubject.next(projects);
        this.activeProjectsSubject.next(activeProjects);
        // this.updateActiveAndArchivedProjects(projects);
        return newProject;
      })
    );
  }

  override update(id: number, item: Project): Observable<Project> {
    return super.update(id, item).pipe(
      map((updatedProject) => {
        const projects = this.projectsSubject.value.map((p) =>
          p.id === id ? updatedProject : p
        );
        this.projectsSubject.next(projects);
        this.updateActiveAndArchivedProjects(projects);
        return updatedProject;
      })
    );
  }

  override delete(id: number): Observable<boolean> {
    return super.delete(id).pipe(
      map((success) => {
        if (success) {
          const projects = this.projectsSubject.value.filter(
            (p) => p.id !== id
          );
          this.projectsSubject.next(projects);
          this.updateActiveAndArchivedProjects(projects);
        }
        return success;
      })
    );
  }

  getActiveProjects(): Observable<Project[]> {
    return this.apollo
      .watchQuery<{ activeProjects: Project[] }>({
        query: gql`
          ${this.typeOperations.getActiveProjects}
        `,
        context: {
          service: 'timesheetService',
        },
      })
      .valueChanges.pipe(
        map((result: any) => {
          const activeProjects = result.data.activeProjects;
          this.activeProjectsSubject.next(activeProjects);
          return activeProjects;
        })
      );
  }

  getArchivedProjects(): Observable<Project[]> {
    return this.apollo
      .watchQuery<{ archivedProjects: Project[] }>({
        query: gql`
          ${this.typeOperations.getArchivedProjects}
        `,
        context: {
          service: 'timesheetService',
        },
      })
      .valueChanges.pipe(
        map((result: any) => {
          const archivedProjects = result.data.archivedProjects;
          this.archivedProjectsSubject.next(archivedProjects);
          return archivedProjects;
        })
      );
  }
}
