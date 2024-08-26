import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  RouterLink,
  RouterModule,
  RouterOutlet,
} from '@angular/router';
import { DocumentEditComponent } from '../components/document-edit/document-edit.component';
import { DocumentUploadComponent } from '../components/document-upload/document-upload.component';
import { DocumentsListComponent } from '../components/Documents/documents-list/documents-list.component';
import { FolderCardsComponent } from '../components/Folders/folder-cards/folder-cards.component';
import { NavLinksComponent } from '../components/navigation-components/nav-links/nav-links.component';
import { NavbarComponent } from '../components/navigation-components/navbar/navbar.component';
import { DocumentModel } from '../models/DocumentModel';
import { Folder } from '../models/Folder';
// import { BreadcrumbComponent } from 'libs/doc-management-module/src/lib/components/navigation-components/breadcrumb/breadcumb.component';

import { BreadcrumbComponent } from '@myb-front/shared-ui';
import { ToastsContainerComponent } from 'libs/shared/shared-ui/src/lib/components/toasts-container/toasts-container.component';
import { FolderDetailsComponent } from '../components/Folders/folder-details/folder-details.component';
import { DocModuleWidgetComponent } from '../doc-module-widget/doc-module-widget.component';
@Component({
  selector: 'myb-front-doc-management-module',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavLinksComponent,
    DocumentEditComponent,
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
export class DocManagementModuleComponent {
  documents: DocumentModel[] = [];
  folders: Folder[] = [];
  fId!: number;

  constructor(private route: ActivatedRoute) {}
  ngOnInit(): void {}
}
