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
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'myb-front-folder-details',
  standalone: true,
  imports: [CommonModule ,NavbarComponent ,NgbDropdownModule,DocumentUploadComponent,FormsModule],
  templateUrl: './folder-details.component.html',
  styleUrl: './folder-details.component.css',
})
export class FolderDetailsComponent  implements OnInit {
  folderId!: number;
  documents: any[] = [];
  folder: any;
  folderName!: string;

  constructor(
    private route: ActivatedRoute,
    private folderService: FolderService,
    private documentService: DocumentService,
    private modalService: NgbModal,
    private router: Router
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

  deleteDocument(docId: number) {
    this.documentService.delete(docId).subscribe(() => {
      console.log('doc deleted');
    });
  }

  openModal(document?: DocumentModel) {
    const modalRef = this.modalService.open(DocumentEditComponent);
    modalRef.componentInstance.documents = this.documents;
    console.log('modal', modalRef.componentInstance.documents);
  }

  getApprovalStatus(document: DocumentStatus): { text: string; badgeClass: string } {
    if (document) {
      return { text: 'Submitted', badgeClass: 'bg-success' };
    } else {
      return { text: 'Approved', badgeClass: 'bg-warning' };
    }
  }
  updateBreadcrumb() {
    const routeData = this.route.snapshot.data;
    if (this.folderName) {
      routeData['breadcrumb'] = this.folderName;
      this.router.config.forEach((route) => {
        if (route.path === 'documents/folder/:id') {
          route.data = routeData;
        }
      });
    }
  }
  filterTimesheets(): void {
    // Implement filtering logic
  }
  // downloadFile(document: DocumentModel): void {
  //   const link = window.document.createElement('a'); // Changed here
  //   link.href = document.file!;
  //   link.download = document.documentName!;
  //   link.click();
  // }
  // downloadDocument(document: any) {
  //   this.documentService.download(document.id).subscribe((response: any) => {
  //     const blob = new Blob([response], { type: 'application/pdf' });
  //     saveAs(blob, document.documentName);
  //   });
  // }
}