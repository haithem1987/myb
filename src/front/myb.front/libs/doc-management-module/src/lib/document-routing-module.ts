import { RouterModule, Routes } from "@angular/router";
import { DocManagementModuleComponent } from "./doc-management-module/doc-management-module.component";
import { NgModule } from "@angular/core";
import { FolderDetailsComponent } from "./components/Folders/folder-details/folder-details.component";

 const documentsRoutes: Routes = [
    {
      path: '',
      component: DocManagementModuleComponent,
      children: [
        {
          path: 'folder/:id', component :FolderDetailsComponent
        },

       ],



    },
  ];
  
  @NgModule({
    imports: [RouterModule.forChild(documentsRoutes)],
    exports: [RouterModule],
  })
  export class DocumentroutingModule {}
  