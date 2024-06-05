import { RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";
import { FolderDetailsComponent } from "./components/Folders/folder-details/folder-details.component";
import { FolderIndexComponent } from "./components/Folders/index/folder-index.component";
import { DocManagementModuleComponent } from "./doc-management-module/doc-management-module.component";

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
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(documentsRoutes)],
  exports: [RouterModule],
})
export class DocumentroutingModule {}
