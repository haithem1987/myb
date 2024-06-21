import { RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";
import { FolderDetailsComponent } from "./components/Folders/folder-details/folder-details.component";
import { FolderIndexComponent } from "./components/Folders/index/folder-index.component";
import { DocManagementModuleComponent } from "./doc-management-module/doc-management-module.component";
import { LogsComponent } from "./components/logs/logs.component";

const documentsRoutes: Routes = [
  {
    path: '',
    component: DocManagementModuleComponent,
    data: { breadcrumb: 'Documents' },
    children: [
      {
        path: '',
        component: FolderIndexComponent,
        data: { breadcrumb: 'Folders' },
      },
      {
        path: 'folder/:id',
        component: FolderDetailsComponent,
        data: { breadcrumb: 'Folder' },
      },
      {
        path: 'logs',
        component: LogsComponent,
        data: { breadcrumb: 'Logs' },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(documentsRoutes)],
  exports: [RouterModule],
})
export class DocumentroutingModule {}
