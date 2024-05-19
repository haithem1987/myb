import { Injectable } from '@angular/core';
import { Routes } from '@angular/router';
import { timesheetRoutes } from '../timesheet-routing.module';

interface NavRoute {
  label: string;
  path: string;
}

@Injectable({
  providedIn: 'root',
})
export class NavRoutesService {
  getRoutes(): NavRoute[] {
    const navRoutes: NavRoute[] = [];
    this.extractRoutes(timesheetRoutes, navRoutes);
    return navRoutes;
  }

  private extractRoutes(
    routes: Routes,
    navRoutes: NavRoute[],
    basePath: string = ''
  ): void {
    for (const route of routes) {
      if (route.data && route.data['breadcrumb']) {
        navRoutes.push({
          label: route.data['breadcrumb'],
          path: basePath + (basePath ? '/' : '') + route.path,
        });
      }
      if (route.children) {
        this.extractRoutes(
          route.children,
          navRoutes,
          basePath + (basePath ? '/' : '') + route.path
        );
      }
    }
  }
}
