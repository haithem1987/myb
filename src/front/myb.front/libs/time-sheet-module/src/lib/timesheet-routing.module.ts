import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRouteSnapshot, RouterModule, Routes } from '@angular/router';
import { TimeSheetModuleComponent } from '..';
import { TaskScreenComponent } from './screens/task-screen/task-screen.component';
import { TimesheetScreenComponent } from './screens/timesheet-screen/timesheet-screen.component';
import { ProjectIndexComponent } from './screens/projects/index/project-index.component';
import { EditProjectComponent } from './screens/projects/edit/edit-project.component';
import { ProjectListComponent } from './screens/projects/list/project-list.component';
import { EmployeeIndexComponent } from './screens/employees/index/employee-index.component';
import { EmployeeListComponent } from './screens/employees/list/employee-list.component';
import { EmployeeEditComponent } from './screens/employees/edit/employee-edit.component';
import { ProjectTabsComponent } from './screens/projects/tabs/project-tabs.component';

export const timesheetRoutes: Routes = [
  {
    path: '',
    component: TimeSheetModuleComponent,
    data: { breadcrumb: 'Timesheet' },
    children: [
      {
        path: '',
        component: TimesheetScreenComponent,
        data: { breadcrumb: 'Temps de travail' },
      },
      {
        path: 'projects',
        component: ProjectIndexComponent,
        data: { breadcrumb: 'Projets' },
        children: [
          {
            path: '',
            component: ProjectTabsComponent,
            data: { breadcrumb: 'Liste' },
          },
          {
            path: 'new',
            component: EditProjectComponent,
            data: { breadcrumb: 'Créer' },
          },
          {
            path: 'edit/:id',
            component: EditProjectComponent,
            data: { breadcrumb: 'Editer' },
          },
          {
            path: ':projectId/tasks',
            component: TaskScreenComponent,
            data: {
              breadcrumb: (route: ActivatedRouteSnapshot) => {
                console.log('route.paramMap', route.paramMap);
                return `${route.paramMap.get('projectId')}`;
              },
            },
          },
        ],
      },
      {
        path: 'employees',
        component: EmployeeIndexComponent,
        data: { breadcrumb: 'Intervenants' },
        children: [
          {
            path: '',
            component: EmployeeListComponent,
            data: { breadcrumb: 'Liste' },
          },
          {
            path: 'new',
            component: EmployeeEditComponent,
            data: { breadcrumb: 'Créer' },
          },
          {
            path: 'edit/:id',
            component: EmployeeEditComponent,
            data: { breadcrumb: 'Editer' },
          },
        ],
      },
      {
        path: 'tasks',
        component: TaskScreenComponent,
        data: { breadcrumb: 'Tâches' },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(timesheetRoutes)],
  exports: [RouterModule],
})
export class TimesheetRoutingModule {}
