import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { FolderCreationComponent } from '../../Folders/folder-creation/folder-creation.component';
import { DocumentCreationComponent } from '../../document-creation/document-creation.component';
import { Folder } from '../../../models/Folder';
import { DocumentModel } from '../../../models/DocumentModel';
import { FolderService } from '../../../services/folder.service';
import { FolderDetailsComponent } from '../../Folders/folder-details/folder-details.component';
import { FolderListComponent } from "../../Folders/folder-list/folder-list.component";

@Component({
    selector: 'myb-front-nav-links',
    standalone: true,
    templateUrl: './nav-links.component.html',
    styleUrl: './nav-links.component.css',
    imports: [
      CommonModule, 
      NgbNavModule, 
      NavLinksComponent,
       FolderDetailsComponent, 
       FolderListComponent
      ]
})

export class NavLinksComponent {
  folders: Folder[] = [];
  documents: DocumentModel[] = [];

  @Output() folderCreated = new EventEmitter<Folder>();
  @Output() documentCreated = new EventEmitter<DocumentModel>();

  constructor(
    private modalService: NgbModal, 
    private folderService: FolderService,    
  ) {}

  ngOnInit() {
    this.loadFolders();
  }

  loadFolders() {
    this.folderService.getAll().subscribe(
      (data: Folder[]) => {
        this.folders = data;
      },
      (error) => {
        console.error('Error loading folders', error);
      }
    );
  }

  openModal() {
    const modalRef = this.modalService.open(FolderCreationComponent);
    modalRef.componentInstance.folderCreated.subscribe((newFolder: Folder) => {
      this.folders = [...this.folders, newFolder]; 
    });

    
  }

  openModalDoc() {
    const modalRef = this.modalService.open(DocumentCreationComponent);
    modalRef.componentInstance.documentCreated.subscribe((newDoc: DocumentModel) => {
      this.documents = [...this.documents, newDoc]; 
    });
  }
 
  
}
