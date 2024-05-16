import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { TimeSheetModuleComponent } from '..';
import { TaskScreenComponent } from './screens/task-screen/task-screen.component';
import { TimesheetScreenComponent } from './screens/timesheet-screen/timesheet-screen.component';
import { ProjectIndexComponent } from './screens/projects/index/project-index.component';
import { EditProjectComponent } from './screens/projects/edit/edit-project.component';

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
            path: 'new',
            component: EditProjectComponent,
            data: { breadcrumb: 'Créer' },
          },
          {
            path: 'edit/:id',
            component: EditProjectComponent,
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
