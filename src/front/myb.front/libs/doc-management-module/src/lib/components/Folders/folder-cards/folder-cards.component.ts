import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FolderService } from '../../../services/folder.service';
import { Folder } from '../../../models/Folder';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FolderCreationComponent } from '../folder-creation/folder-creation.component';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { FolderDetailsComponent } from '../folder-details/folder-details.component';
import { DocumentModel } from '../../../models/DocumentModel';
import { DocumentUploadComponent } from '../../document-upload/document-upload.component';
import { DocumentCreationComponent } from '../../document-creation/document-creation.component';
import { FolderListComponent } from '../folder-list/folder-list.component';
import { FormsModule } from '@angular/forms';
import { NavLinksComponent } from '../../navigation-components/nav-links/nav-links.component';

@Component({
  selector: 'myb-front-folder-cards',
  standalone: true,
  imports: [
    CommonModule ,
    RouterLink, 
    FolderDetailsComponent, 
    DocumentUploadComponent,
    RouterOutlet,  
    FormsModule,
    FolderListComponent,
    NavLinksComponent
  ] ,
  templateUrl: './folder-cards.component.html',
  styleUrl: './folder-cards.component.css',
})
export class FolderCardsComponent  implements OnInit {
  folders: Folder[] = [];
  documents: DocumentModel[] = [];
  searchTerm: string = '';
  @Output() folderCreated = new EventEmitter<Folder>();
  @Output() documentCreated = new EventEmitter<DocumentModel>();

  constructor(
    private modalService: NgbModal, 
    private folderService: FolderService,    
    private router: Router
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
  filterTimesheets(): void {
    // Implement filtering logic
  }

  // getDocumentCount(folder: Folder): number {
  //   return folder.documents ? folder.documents.length : 0;
  // }


  //delete doc
// deleteFolder(id: number){
//   if (id==-1) {
//     return;
//   }
//   this.folderService.delete(id).subscribe(() => {
//     this.loadFolders();
//     // this.documents = this.documents.filter(doc => doc.id !== docId);
//     console.log('folder deleted',id)

//   });

// }
//update folder
// updateFolder(folder: Folder) {
//   this.folderService.update(folder.id, folder).subscribe(
//     (updatedFolder) => {
//       console.log('Folder updated:', updatedFolder);
//       this.loadFolders();
//     },
//     (error) => {
//       console.error('Error updating folder:', error);
//     }
//   );
// }
}