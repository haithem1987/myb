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
import { base64ToBlob } from '../../../base64-to-blob';
import { ToastService } from 'libs/shared/infra/services/toast.service';
import { NoResultComponent } from 'libs/shared/shared-ui/src/lib/components/no-result/no-result.component';
import { Folder } from '../../../models/Folder';
import { FolderCreationComponent } from '../folder-creation/folder-creation.component';

@Component({
  selector: 'myb-front-folder-details',
  standalone: true,
  imports: [
    CommonModule, 
    NavbarComponent, 
    NgbDropdownModule, 
    DocumentUploadComponent, 
    FormsModule,
    NoResultComponent
  ],
  templateUrl: './folder-details.component.html',
  styleUrls: ['./folder-details.component.css'],
})
export class FolderDetailsComponent implements OnInit {
  folderId!: number;
  documents: DocumentModel[] = [];
  folder: any;
  folderName!: string;
  DocumentStatus: any;

  constructor(
    private route: ActivatedRoute,
    private folderService: FolderService,
    private documentService: DocumentService,
    private modalService: NgbModal,
    private  toastService: ToastService
  ) {}

  ngOnInit(): void {
    console.log('FolderDetailsComponent initialized');

    this.folderId = +this.route.snapshot.paramMap.get('id')!;
    this.loadDocumentsWithinFolder();
   
  }

  loadDocumentsWithinFolder() {
    console.log('Fetching details for folder ID:', this.folderId);
    //console.log('parentid', this.folder.parentId);
    this.folderService.getById(this.folderId).subscribe(
      (data: any) => {
        
        console.log('Raw response data:', data);
        
        if (data && data.id) {
          this.folder = data;
          this.documents = this.folder.documents.map((doc: any) => {
            console.log('Document:', doc); 
            return {
              ...doc,
              file: doc.file 
            };
          });
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
      this.toastService.show('Document Deleted successfully!', {
        classname: 'bg-success text-light ',
      });
      this.loadDocumentsWithinFolder(); 
    });
  }

  openModal(document?: DocumentModel) {
    const modalRef = this.modalService.open(DocumentEditComponent);
    modalRef.componentInstance.document = { ...document };
    modalRef.componentInstance.documentUpdated.subscribe((updatedDocument: DocumentModel) => {
      const index = this.documents.findIndex(doc => doc.id === updatedDocument.id);
      if (index !== -1) {
        this.documents[index] = updatedDocument;
      }
    });
  }

  getApprovalStatus(status: DocumentStatus): { text: string; badgeClass: string } {
    switch (status) {
      case DocumentStatus.Submitted:
        return { text: 'Submitted', badgeClass: 'bg-success' };
      case DocumentStatus.Approved:
        return { text: 'Approved', badgeClass: 'bg-warning' };
      case DocumentStatus.Rejected:
        return { text: 'Rejected', badgeClass: 'bg-danger' };
      default:
        return { text: 'Unknown', badgeClass: 'bg-secondary' };
    }
  }


  // updateBreadcrumb() {
  //   const routeData = this.route.snapshot.data;
  //   if (this.folderName) {
  //     routeData['breadcrumb'] = this.folderName;
  //     this.router.config.forEach((route) => {
  //       if (route.path === 'documents/folder/:id') {
  //         route.data = routeData;
  //       }
  //     });
  //   }
  // }

  filterDocument(): void {
    // Implement filtering logic
  }


  downloadDocument(document: DocumentModel): void {
    console.log('Attempting to download document:', document);
  
    const { file, documentName } = document;
    console.log('Document file:', file);
    console.log('Document name:', documentName);
  
    if (file && documentName) {
      try {
        // Ensure the base64 string is correctly formatted
        const base64String = file.split(',')[1]; // Remove the data type prefix if present
        if (base64String) {
          const blob = this.b64toBlob(base64String, 'application/pdf');
          const link = window.document.createElement('a'); 
          link.href = URL.createObjectURL(blob);
          link.download = documentName;
          link.click();
          URL.revokeObjectURL(link.href);
        } else {
          console.error('Base64 string is missing or malformed.');
        }
      } catch (error) {
        console.error('Error while processing base64 string:', error);
      }
    } else {
      console.error('File data or document name is undefined', document);
    }
  }
  
  b64toBlob(b64Data: string, contentType: string = '', sliceSize: number = 512): Blob {
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
  
  viewDocument(document: DocumentModel): void {
    console.log('Attempting to view document:', document);
    const { file, documentName } = document;
    console.log('Document file:', file);
    console.log('Document name:', documentName);

    if (file && documentName) {
      try {
        const base64String = file.split(',')[1];
        if (base64String) {
          const contentType = this.getContentType(documentName);
          const blob = this.b64toBlob(base64String, contentType);
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
        } else {
          console.error('Base64 string is missing or malformed.');
        }
      } catch (error) {
        console.error('Error while processing base64 string:', error);
      }
    } else {
      console.error('File data or document name is undefined', document);
    }
  }

  getContentType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'application/pdf';
      case 'png': return 'image/png';
      case 'jpeg':
      case 'jpg': return 'image/jpeg';
      case 'xls': return 'application/vnd.ms-excel';
      case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      // Add more cases for other file types if needed
      default: return 'application/octet-stream';
    }
  }


  openFolderCreationModal() {
    const modalRef = this.modalService.open(FolderCreationComponent);
    modalRef.componentInstance.parentId = this.folderId; // Pass current folder ID as parent ID
    modalRef.componentInstance.folderCreated.subscribe((newFolder: Folder) => {
      if (this.folder?.subFolders) {
        this.folder.subFolders.push(newFolder); // Add new subfolder to the current folder's subfolders
      } else {
        this.folder!.subFolders = [newFolder];
      }
    });
  }
  
}
