import { FolderService } from './../../../services/folder.service';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentModel } from '../../../models/DocumentModel';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DocumentService } from '../../../services/Document.service';
import { NavbarComponent } from '../../navigation-components/navbar/navbar.component';
import { DocumentStatus } from '../../../models/DocumentStatus';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DocumentUploadComponent } from '../../document-upload/document-upload.component';
import { DocumentEditComponent } from '../../document-edit/document-edit.component';
import { FormsModule } from '@angular/forms';
import { ToastService } from 'libs/shared/infra/services/toast.service';
import { NoResultComponent } from 'libs/shared/shared-ui/src/lib/components/no-result/no-result.component';
import { Folder } from '../../../models/Folder';
import { FolderCreationComponent } from '../folder-creation/folder-creation.component';
import { DocumentCreationComponent } from '../../document-creation/document-creation.component';

@Component({
  selector: 'myb-front-folder-details',
  standalone: true,
  imports: [
    CommonModule, 
    NavbarComponent, 
    NgbDropdownModule, 
    DocumentUploadComponent, 
    FormsModule,
    NoResultComponent,
    RouterLink
  ],
  templateUrl: './folder-details.component.html',
  styleUrls: ['./folder-details.component.css'],
})
export class FolderDetailsComponent implements OnInit {
  fId!: number;

  documents: DocumentModel[] = [];
  folder: any;
  folderName!: string;
  DocumentStatus: any;
  @Input() folders: Folder[] = [];
  @Input()parentId!: number;
  pinnedFolders: Folder[] = [];


  @Output() folderDeleted = new EventEmitter<number>();
  @Output() folderPinned = new EventEmitter<Folder>();





  constructor(
    private route: ActivatedRoute,
    private folderService: FolderService,
    private documentService: DocumentService,
    private modalService: NgbModal,
    private  toastService: ToastService,
    private router: Router,


  ) {}

  ngOnInit(): void {

    this.fId = +this.route.snapshot.paramMap.get('id')!;
    console.log('this is  folderid from details ', this.fId)

    this.loadFolderDetails();
    this.loadFoldersByParentId(this.fId);
  }

  openFolder(folderId: number): void {
    this.fId = folderId;
    this.loadFolderDetails();
    this.loadFoldersByParentId(this.fId);
     this.router.navigate(['documents/folder', folderId]);

  }

//  ngOnInit(): void {
//     this.route.paramMap.subscribe(params => {
//       this.fId = +params.get('id')!;
//       console.log('this is folderid from details ', this.fId);
//       this.loadFolderDetails();
//       this.loadFoldersByParentId(this.fId);
//     });
//   }

//   openFolder(folderId: number): void {
//     this.router.navigate(['/folders', folderId]);
//   }


  openFolderCreationModal(): void {
    const modalRef = this.modalService.open(FolderCreationComponent);
    modalRef.componentInstance.folderId = this.fId; 
    modalRef.componentInstance.parentId=this.folder?.parentId;
    console.log('Passing folderId to modal:', this.fId);
    console.log('Loading parentid',this.folder.parentId);
    modalRef.componentInstance.folderCreated.subscribe((newFolder: Folder) => {
      this.folders.push(newFolder); 
    });
  }
  
  // loadDocumentsWithinFolder() {
  //   this.folderService.getById(this.folderId).subscribe(
  //     (data: any) => {
        
  //       console.log('Raw response data:', data);
        
  //       if (data && data.id) {
  //         this.folder = data;
  //         this.folders = data.children;

  //         console.log('Loading parentid',this.folder.parentId);

  //         this.documents = this.folder.documents.map((doc: any) => {
  //           // console.log('Document:', doc); 
  //           return {
  //             ...doc,
  //             file: doc.file 
  //           };
  //         });
  //         // console.log('Documents in folder:', this.documents);
      
  //       } else {
  //         console.error('Invalid response structure:', data);
  //       }
  //     },
  //     (error: any) => {
  //       console.error('Error fetching folder details:', error);
  //       if (error.networkError) {
  //         console.error('Network error:', error.networkError);
  //       }
  //       if (error.graphQLErrors) {
  //         error.graphQLErrors.forEach((err: any) => {
  //           console.error('GraphQL error:', err);
  //         });
  //       }
  //     }
  //   );
  // }
  loadFolderDetails(): void {
    this.folderService.getById(this.fId).subscribe(
      (data: Folder) => {
        this.folder = data;
        // this.folders = data. || [];
        this.documents = data.documents || [];
        console.log('Loading fId',this.fId)
        console.log('Loading parentid',this.folder.parentId);

      },
      (error) => {
        console.error('Error fetching folder details:', error);

      }
    );
  }
  loadFoldersByParentId(parentId: number): void {
    this.folderService.getFoldersByParentId(parentId).subscribe(
      (data: Folder[]) => {
        this.folders = data;
        console.log('alllFolders by parentId:', data);
      },
      (error) => {
        console.error('Error fetching folders by parentId:', error);
      }
    );
  }
  deleteDocument(docId: number) {
    this.documentService.delete(docId).subscribe(() => {
      console.log('doc deleted');
      this.toastService.show('Document Deleted successfully!', {
        classname: 'bg-success text-light ',
      });
      this.loadFolderDetails(); 
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

  // loadFoldersByParentId() {
  //   if (this.parentId !== null) {
  //     this.folderService.getFoldersByParentId(this.parentId).subscribe(
  //       (data: any) => {
          
  //         console.log('Raw response data:', data);
          
  //         if (data && data.id) {
  //           this.folder = data;
  //           this.folders = data.children;
  
  //           console.log('Loading parentid',this.folder.parentId);
  
  //           this.documents = this.folder.documents.map((doc: any) => {
  //             // console.log('Document:', doc); 
  //             return {
  //               ...doc,
  //               file: doc.file 
  //             };
  //           });
  //           // console.log('Documents in folder:', this.documents);
        
  //         } else {
  //           console.error('Invalid response structure:', data);
  //         }
  //       },
  //       (error: any) => {
  //         console.error('Error fetching folder details:', error);
  //         if (error.networkError) {
  //           console.error('Network error:', error.networkError);
  //         }
  //         if (error.graphQLErrors) {
  //           error.graphQLErrors.forEach((err: any) => {
  //             console.error('GraphQL error:', err);
  //           });
  //         }
  //       }
  //     );
  //   }}
  
  
  deleteFolder(id: number) {
    if (id == -1) {
      return;
    }
    this.folderService.delete(id).subscribe(() => {
      this.folderDeleted.emit(id);
      console.log('Folder deleted')
    });
    
  }
  pinFolder(folder: Folder): void {
    this.folderPinned.emit(folder);
  }


  togglePinFolder(folder: Folder) {
    const index = this.pinnedFolders.findIndex(f => f.id === folder.id);
    if (index === -1) {
      this.pinnedFolders.push(folder);
    } else {
      this.pinnedFolders.splice(index, 1);
    }
  }

  isPinned(folder: Folder): boolean {
    return this.pinnedFolders.some(f => f.id === folder.id);
  }


  openModalDoc(): void {
    const modalRef = this.modalService.open(DocumentCreationComponent);
    modalRef.componentInstance.folderId = this.fId; 
    modalRef.componentInstance.parentId=this.folder.parentId;
    console.log(' folderId from ddoc creation :', this.fId);
    console.log(' parentid from ddoc creation',this.folder.parentId);
    modalRef.componentInstance.documentCreated.subscribe((newDoc: DocumentModel) => {
      this.documents = [...this.documents, newDoc];
      console.log('New document created:', newDoc);
    });
  }
  }