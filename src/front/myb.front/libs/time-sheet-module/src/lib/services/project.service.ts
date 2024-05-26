import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Project } from '../models/project.model';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { RepositoryService } from 'libs/shared/shared-ui/src/lib/services/repository.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectService extends RepositoryService<Project> {
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  public projects$ = this.projectsSubject.asObservable();

  constructor(apollo: Apollo) {
    super(apollo, 'Project');
    this.loadInitialProjects();
  }

  private loadInitialProjects(): void {
    this.getAll().subscribe((projects) => this.projectsSubject.next(projects));
  }

  protected override mapAllItems(result: any): Project[] {
    return result.data?.allProjects || [];
  }

  protected override mapSingleItem(result: any): Project {
    return result.data?.projectById as Project;
  }

  protected override mapCreateItem(result: any): Project {
    console.log('mapCreateItem', result);
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
        return projects;
      })
    );
  }

  override get(id: number): Observable<Project> {
    return super.get(id).pipe(
      map((project) => {
        const updatedProjects = this.projectsSubject.value.map((p) =>
          p.id === id ? project : p
        );
        this.projectsSubject.next(updatedProjects);
        return project;
      })
    );
  }

  override create(item: Project): Observable<Project> {
    return super.create(item).pipe(
      map((newProject) => {
        console.log('newProject', newProject);
        const projects = [...this.projectsSubject.value, newProject];
        this.projectsSubject.next(projects);
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
        }
        return success;
      })
    );
  }
}
