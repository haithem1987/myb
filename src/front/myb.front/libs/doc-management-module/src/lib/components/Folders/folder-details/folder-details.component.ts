import { FolderService } from './../../../services/folder.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentModel } from '../../../models/DocumentModel';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentService } from '../../../services/Document.service';
import { NavbarComponent } from '../../navigation-components/navbar/navbar.component';
import { DocumentStatus } from '../../../models/DocumentStatus';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DocumentUploadComponent } from '../../document-upload/document-upload.component';
import { DocumentEditComponent } from '../../document-edit/document-edit.component';

@Component({
  selector: 'myb-front-folder-details',
  standalone: true,
  imports: [CommonModule ,NavbarComponent ,NgbDropdownModule,DocumentUploadComponent],
  templateUrl: './folder-details.component.html',
  styleUrl: './folder-details.component.css',
})
export class FolderDetailsComponent  implements OnInit {
  folderId!: number;
  documents: any[] = [];
  folder: any;

  constructor(
    private route: ActivatedRoute,
    private folderService: FolderService,
    private DocumentService: DocumentService,
    private modalService: NgbModal,
    private router:Router
  ) {}

  ngOnInit(): void {
    console.log('FolderDetailsComponent initialized');

    this.folderId = +this.route.snapshot.paramMap.get('id')!;
    this.loadDocumentsWithinFolder();
  }

  loadDocumentsWithinFolder() {
    console.log('Fetching details for folder ID:', this.folderId);
    this.folderService.getById(this.folderId).subscribe(
      (data: any) => {
        console.log('Raw response data:', data);
        if (data && data.id) {
          this.folder = data; 
          this.documents = this.folder.documents;
          console.log('Documents in folder:', this.documents);
        } else {
          console.error('Invalid response structure:', data);
        }
      },
      (error: any) => {
        console.error('Error fetching folder details:', error);
        if (error.networkError) {
          console.error('Network error:', error.networkError);
        }
        if (error.graphQLErrors) {
          error.graphQLErrors.forEach((err: any) => {
            console.error('GraphQL error:', err);
          });
        }
      }
    );
  }

  
    //alldoc
    // loadDocuments() {
    //   this.DocumentService.getAll().subscribe((data: any) => {
    //     console.log("Received data from server:", data);
    //   //  console.log('status ',data.status);
        
    //     if (data && data.allDocuments && Array.isArray(data.allDocuments)) {
    //       this.documents = data.allDocuments;
    //     } else {
    //       console.error("Invalid data format received from the server");
    //     }
    //   });
    // }
    
//delete doc
deleteDocument(docId: number){
  this.DocumentService.delete(docId).subscribe(() => {
    // this.loadDocuments();
    // this.documents = this.documents.filter(doc => doc.id !== docId);
console.log('doc deleted');
  });

}
//modal 
	openModal(document?: DocumentModel) {
		const modalRef = this.modalService.open(DocumentEditComponent);
    modalRef.componentInstance.documents = this.documents;
    console.log('modal',modalRef.componentInstance.documents)
	}



  getApprovalStatus(document: DocumentStatus): {
    text: string;
    badgeClass: string;
  } {
    if (document) {
      return { text: 'Submitted', badgeClass: 'bg-success' };
    } else {
      return { text: 'Approved', badgeClass: 'bg-warning' };
    }
  }
 
}