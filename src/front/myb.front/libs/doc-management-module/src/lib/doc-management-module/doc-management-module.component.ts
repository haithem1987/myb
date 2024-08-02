import { DocumentStatus } from './../models/DocumentStatus';
import { DocumentsListComponent } from '../components/Documents/documents-list/documents-list.component';
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../services/Document.service';
import { DocumentModel } from '../models/DocumentModel';
import { DocumentType } from '../models/DocumentType';
import { NavLinksComponent } from '../components/navigation-components/nav-links/nav-links.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DocumentEditComponent } from '../components/document-edit/document-edit.component';
import { BehaviorSubject, Observable } from 'rxjs';
import { DocumentUploadComponent } from '../components/document-upload/document-upload.component';
import { FolderCardsComponent } from '../components/Folders/folder-cards/folder-cards.component';
import { Folder } from '../models/Folder';
import { FolderService } from '../services/folder.service';
import { ActivatedRoute, RouterLink, RouterModule , RouterOutlet } from '@angular/router';
import { SelectedFiles, UploadFilesService } from '../services/upload-files.service';
import { NavbarComponent } from '../components/navigation-components/navbar/navbar.component';
import { BreadcrumbComponent } from 'libs/time-sheet-module/src/lib/components/breadcrumb/breadcrumb.component';
// import { BreadcrumbComponent } from 'libs/doc-management-module/src/lib/components/navigation-components/breadcrumb/breadcumb.component';

import { ToastsContainerComponent } from 'libs/shared/shared-ui/src/lib/components/toasts-container/toasts-container.component';
import { DocModuleWidgetComponent } from '../doc-module-widget/doc-module-widget.component';
import { FolderDetailsComponent } from '../components/Folders/folder-details/folder-details.component';
@Component({
  selector: 'myb-front-doc-management-module',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule , 
    NavLinksComponent , 
    DocumentEditComponent ,
    DocumentUploadComponent,
    FolderCardsComponent,
    DocumentsListComponent,
    RouterModule,
    RouterLink,
    NavbarComponent,
    RouterOutlet,
    BreadcrumbComponent,
    ToastsContainerComponent,
    DocModuleWidgetComponent,
    FolderDetailsComponent,

    

  ],
  templateUrl: './doc-management-module.component.html',
  styleUrl: './doc-management-module.component.css',
})
export class DocManagementModuleComponent  {
documents :DocumentModel[] = [];
folders:Folder[] = []
fId!: number;

constructor(    private route: ActivatedRoute
){}
ngOnInit(): void {
  
}




}
