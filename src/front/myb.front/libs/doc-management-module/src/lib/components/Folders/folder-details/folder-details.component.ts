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
  imports: [CommonModule, NavbarComponent, NgbDropdownModule, DocumentUploadComponent, FormsModule],
  templateUrl: './folder-details.component.html',
  styleUrls: ['./folder-details.component.css'],
})
export class FolderDetailsComponent implements OnInit {
  folderId!: number;
  documents: DocumentModel[] = [];
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
      this.loadDocumentsWithinFolder(); // Reload documents after deletion
    });
  }

  openModal(document?: DocumentModel) {
    const modalRef = this.modalService.open(DocumentEditComponent);
    modalRef.componentInstance.document = { ...document }; // Pass a shallow copy to avoid mutation issues
    modalRef.componentInstance.documentUpdated.subscribe((updatedDocument: DocumentModel) => {
      const index = this.documents.findIndex(doc => doc.id === updatedDocument.id);
      if (index !== -1) {
        this.documents[index] = updatedDocument;
      }
    });
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
  viewDocument(base64String: string): void {
    const blob = this.b64toBlob(base64String, 'application/octet-stream');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    URL.revokeObjectURL(url);
  }

  downloadDocument(base64String: string, fileName: string): void {
    const blob = this.b64toBlob(base64String, 'application/octet-stream');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  b64toBlob(b64Data: string, contentType: string = ''): Blob {
    const sliceSize = 512;
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  }
}
