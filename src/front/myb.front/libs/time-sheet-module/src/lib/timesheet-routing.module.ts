import { NgModule } from '@angular/core';
import { RouterModule, Routes, ActivatedRouteSnapshot } from '@angular/router';
import { TimeSheetModuleComponent } from '..';
import { TaskScreenComponent } from './screens/task-screen/task-screen.component';
import { TimesheetScreenComponent } from './screens/timesheet-screen/timesheet-screen.component';
import { ProjectIndexComponent } from './screens/projects/index/project-index.component';
import { EditProjectComponent } from './screens/projects/edit/edit-project.component';
import { ProjectTabsComponent } from './screens/projects/tabs/project-tabs.component';
import { SettingsPageComponent } from './screens/settings/settings-page.component';
import { EmployeeIndexComponent } from './screens/employees/index/employee-index.component';
import { EmployeeListComponent } from './screens/employees/list/employee-list.component';
import { EmployeeEditComponent } from './screens/employees/edit/employee-edit.component';
import { TranslateService } from '@ngx-translate/core';

export function translateBreadcrumb(translate: TranslateService, key: string) {
  return () => translate.get(key).toPromise();
}

export const timesheetRoutes: Routes = [
  {
    path: '',
    component: TimeSheetModuleComponent,
    data: {
      breadcrumb: 'TIMESHEET',
    },
    children: [
      {
        path: '',
        component: TimesheetScreenComponent,
        data: {
          breadcrumb: 'TIMESHEET_MANAGER',
        },
      },
      {
        path: 'settings',
        component: SettingsPageComponent,
        data: {
          breadcrumb: 'SETTINGS',
        },
      },
      {
        path: 'projects',
        component: ProjectIndexComponent,
        data: {
          breadcrumb: 'PROJECTS',
        },
        children: [
          {
            path: '',
            component: ProjectTabsComponent,
            data: {
              breadcrumb: 'LIST',
            },
          },
          {
            path: 'new',
            component: EditProjectComponent,
            data: {
              breadcrumb: 'CREATE',
            },
          },
          {
            path: 'edit/:id',
            component: EditProjectComponent,
            data: {
              breadcrumb: 'EDIT',
            },
          },
          {
            path: ':projectId/tasks',
            component: TaskScreenComponent,
            data: {
              breadcrumb: (
                route: ActivatedRouteSnapshot,
                translate: TranslateService
              ) => {
                return translate
                  .get('PROJECTS')
                  .toPromise()
                  .then((translation: string) => {
                    return `${translation} ${route.paramMap.get('projectId')}`;
                  });
              },
            },
          },
        ],
      },
      {
        path: 'employees',
        component: EmployeeIndexComponent,
        data: {
          breadcrumb: 'INTERVENANTS',
        },
        children: [
          {
            path: '',
            component: EmployeeListComponent,
            data: {
              breadcrumb: 'LIST',
            },
          },
          {
            path: 'new',
            component: EmployeeEditComponent,
            data: {
              breadcrumb: 'CREATE',
            },
          },
          {
            path: 'edit/:id',
            component: EmployeeEditComponent,
            data: {
              breadcrumb: 'EDIT',
            },
          },
        ],
      },
      {
        path: 'tasks',
        component: TaskScreenComponent,
        data: {
          breadcrumb: 'TASKS',
        },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(timesheetRoutes)],
  exports: [RouterModule],
  providers: [TranslateService],
})
export class TimesheetRoutingModule {}
