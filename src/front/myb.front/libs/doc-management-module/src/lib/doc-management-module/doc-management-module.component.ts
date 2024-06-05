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
import { RouterLink, RouterModule , RouterOutlet } from '@angular/router';
import { SelectedFiles, UploadFilesService } from '../services/upload-files.service';
import { NavbarComponent } from '../components/navigation-components/navbar/navbar.component';
import { BreadcrumbComponent } from 'libs/time-sheet-module/src/lib/components/breadcrumb/breadcrumb.component';
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
    
    

  ],
  templateUrl: './doc-management-module.component.html',
  styleUrl: './doc-management-module.component.css',
})
export class DocManagementModuleComponent implements OnInit {
documents :DocumentModel[] = [];
folders:Folder[] = []

constructor( private files: UploadFilesService ,private DocumentService: DocumentService , private modalService: NgbModal  , private folderService :FolderService){}


  
  ngOnInit(){
    this.loadDocuments();
    this.loadFolders();
  }

 
  //alldoc
  loadDocuments() {
    this.DocumentService.getAll().subscribe((data: any) => {
      console.log("Received data from server:", data);
     console.log('status ',data.status);
      
      if (data && data.allDocuments && Array.isArray(data.allDocuments)) {
        this.documents = data.allDocuments;
      } else {
        console.error("Invalid data format received from the server");
      }
    });
  }
  


loadFolders() {
  this.folderService.getAll().subscribe((data: any) => {
    console.log("Received folders from server:", data);
    
    if (Array.isArray(data)) {
      this.folders = data;
    } else {
      console.error("Invalid data format received from the server");
    }
  }, (error: any) => {
    console.error("Error loading folders", error);
});
}


}
