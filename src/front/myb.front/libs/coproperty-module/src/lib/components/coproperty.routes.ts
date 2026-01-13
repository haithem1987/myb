import { Routes } from '@angular/router';
import { CopropertyComponent } from './coproperty.component';
import { CopropertyListComponent } from './coproperty-list.component';
import { CopropertyDetailComponent } from './coproperty-detail.component';

export const COPROPERTY_ROUTES: Routes = [
  {
    path: '',
    component: CopropertyComponent,
    children: [
      {
        path: '',
        component: CopropertyListComponent,
      },
      {
        path: ':id',
        component: CopropertyDetailComponent,
      },
      {
        path: ':id/edit',
        component: CopropertyDetailComponent,
      },
    ],
  },
];
