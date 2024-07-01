import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface Breadcrumb {
  label: string;
  url: string;
}

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbService {
  private breadcrumbsSubject = new BehaviorSubject<Breadcrumb[]>([]);
  breadcrumbs$ = this.breadcrumbsSubject.asObservable();

  setBreadcrumbs(breadcrumbs: Breadcrumb[]) {
    this.breadcrumbsSubject.next(breadcrumbs);
  }

  getBreadcrumbs(): Breadcrumb[] {
    return this.breadcrumbsSubject.getValue();
  }

  addBreadcrumb(breadcrumb: Breadcrumb) {
    const breadcrumbs = this.getBreadcrumbs();
    breadcrumbs.push(breadcrumb);
    this.setBreadcrumbs(breadcrumbs);
  }

  removeLastBreadcrumb() {
    const breadcrumbs = this.getBreadcrumbs();
    breadcrumbs.pop();
    this.setBreadcrumbs(breadcrumbs);
  }

  resetBreadcrumbs() {
    this.setBreadcrumbs([]);
  }
}
