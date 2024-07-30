import { RootFolderService } from './../../../services/root-folder.service';
import { FolderService } from './../../../services/folder.service';
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
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
import { filter, map, Observable } from 'rxjs';
import { RootFolder } from '../../../models/RootFolder';

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
    RouterLink,
  ],
  templateUrl: './folder-details.component.html',
  styleUrls: ['./folder-details.component.css'],
})
export class FolderDetailsComponent implements OnInit {
  @Input() fId!: number;
  //fid2=38;
  @Input() title!: string;
  //  @Input() parentId!: number;
  @Input() canCreateFolder = true;
  @Input() moduleName!: string;

  //documents: DocumentModel[] = [];
  folder: any;
  folderName!: string;
  folders: Folder[] = [];
  pinnedFolders: Folder[] = [];

  //folders$: Observable<Folder[]> = this.folderService.folders$.pipe(filter((value) => {}));

  // folders$: Observable<Folder[]> = this.folderService.folders$.pipe(
  //   filter((folders) => folders.some(folder => folder.parentId === this.fid2))
  // );
  folders$: Observable<Folder[]> = this.folderService.folders$.pipe(
    map((folders) => folders.filter((folder) => folder.parentId === this.fId))
  );

  // documents$: Observable<DocumentModel[]> = this.documentService.documents$.pipe(
  //   map(documents => documents.filter(document => document.folderId === this.fId))
  // );

  documents$: Observable<DocumentModel[]> = this.documentService.documents$;

  @Output() folderPinned = new EventEmitter<Folder>();

  constructor(
    private route: ActivatedRoute,
    private folderService: FolderService,
    private documentService: DocumentService,
    private modalService: NgbModal,
    private toastService: ToastService,
    private router: Router,
    private RootFolderService: RootFolderService
  ) // private breadcrumbService: BreadcrumbService
  {}
  // ngOnInit(): void {

  //   if (this.fId) {
  //     // this.loadFolderDetails();
  //     this.loadFoldersByParentId(this.fId);
  //   } else {
  //     this.route.paramMap.subscribe(params => {
  //       this.fId = +params.get('id')!;
  //       // this.loadFolderDetails();
  //        this.loadFoldersByParentId(this.fId);
  //     });
  //   }
  // }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.fId = +params.get('id')!;
      this.loadFolderDetails();
    });
    console.log('ngOnInit FolderDetailsComponent', this.fId);
  }

  getRootFolder(userId: string, moduleName: string) {
    this.RootFolderService.getRootFolderByUserAndModule(
      userId,
      moduleName
    ).subscribe({
      next: (data: RootFolder) => {
        this.folder = data;
        console.log('RootFolder:', data);
      },
      error: (error) => {
        console.error('Error fetching root folder:', error);
      },
    });
  }
  addFolderRoot() {}
  CheckFolderRoot() {}
  
  loadFolders() {
    this.folderService.getAll().subscribe({
      next: (data: Folder[]) => {
        this.folders = data;
        console.log('loaded folders func', data);
      },

      error: (error) => {
        console.error('Error loading folders', error);
      },
      complete: () => {
        console.log('Folders loading completed');
      },
    });
}

  openFolder(folderId: number): void {
    this.fId = folderId;
    this.loadFolderDetails();
    // this.loadFoldersByParentId(this.fId);
    console.log('openflder', folderId, this.fId);
    console.log('this.documents$', this.documents$);

    console.log('fid', this.fId, 'folderId', folderId);
  }
  
  goBackToPreviousFolder(): void {
    this.fId = this.folder.parentId;
    this.loadFolderDetails();
    //this.loadFoldersByParentId(this.fId);
    console.log('first', this.folder);
  }
  // goBackToPreviousFolder(): void {
  //   // Check if the current folder's parentId is 0
  //   if (this.folder.parentId === 0) {
  //     // If parentId is 0, set fId to the root folder id (assuming root folder id is 0 or a specific value)
  //     this.fId = 0; // Set to root folder id if different from 0
  //   } else {
  //     // Otherwise, set fId to the parentId of the current folder
  //     this.fId = this.folder.parentId;
  //   }
  
  //   // Load the details of the folder based on the updated fId
  //   this.loadFolderDetails();
  //   this.loadFoldersByParentId(this.fId);
  //   console.log('Navigated back to folder with id:', this.fId);
  // }
  

  loadFolderDetails(): void {
    this.folderService.get(this.fId).subscribe({
      next: (data: Folder) => {
        this.folder = data;
        // this.documents = data.documents || [];
        this.folderName = data.folderName;
        console.log('Loading fId', this.fId);
        console.log('Loading parentid', this.folder.parentId);
        console.log('Folder details:', data);
      },
      error: (error) => {
        console.error('Error fetching folder details:', error);
      },
    });
  }

  //load getDocumentsByFolderId

  loadFoldersByParentId(parentId: number): void {
    this.folderService.getFoldersByParentId(parentId).subscribe({
      next: (data: Folder[]) => {
        this.folders = data;

        console.log('allFolders by parentId:', data);
      },
      error: (error) => {
        console.error('Error fetching folders by parentId:', error);
      },
    });
  }

  deleteDocument(id: number) {
    if (confirm('Are you sure you want to delete this doc?')) {
      this.documentService.delete(id).subscribe({
        next: () => {
          console.log('doc deleted');
          this.toastService.show('Document Deleted successfully!', {
            classname: 'bg-success text-light ',
          });
          // Remove the document from the local array
        //  this.documents = this.documents.filter(doc => doc.id !== docId);
        },
        error: (error) => {
          console.error('Error deleting document:', error);
          this.toastService.show('An error occurred while deleting the document.', {
            classname: 'bg-danger text-light ',
          });
        }
      });
    }
  }

  openModal(document?: DocumentModel) {
    // const modalRef = this.modalService.open(DocumentEditComponent);
    // modalRef.componentInstance.document = { ...document };
    // modalRef.componentInstance.documentUpdated.subscribe(
    //   (updatedDocument: DocumentModel) => {
    //     const index = this.documents.findIndex(
    //       (doc) => doc.id === updatedDocument.id
    //     );
    //     if (index !== -1) {
    //       this.documents[index] = updatedDocument;
    //     }
    //   }
    // );
  }

  getApprovalStatus(status: DocumentStatus): {
    text: string;
    badgeClass: string;
  } {
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

  b64toBlob(
    b64Data: string,
    contentType: string = '',
    sliceSize: number = 512
  ): Blob {
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
      case 'pdf':
        return 'application/pdf';
      case 'png':
        return 'image/png';
      case 'jpeg':
      case 'jpg':
        return 'image/jpeg';
      case 'xls':
        return 'application/vnd.ms-excel';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'docx':
        return 'application/msword';

      // Add more cases for other file types if needed
      default:
        return 'application/octet-stream';
    }
  }

  // deleteFolder(id: number) {
  //   this.folderService.delete(id).subscribe(() => {
  //     // this.folderDeleted.emit(id);
  //     // this.loadFoldersByParentId(this.fId); // Ensure the folder list is updated
  //     this.loadFolderDetails()
  //   });
  // }

  deleteFolder(id: number): void {
    if (confirm('Are you sure you want to delete this folder?')) {
      this.folderService.delete(id).subscribe({
        next: () => {
          console.log('Folder deleted');
          //this.loadFoldersByParentId(this.fId); // Reload the folder list after deletion
        },
        error: (error) => console.error('Error deleting folder', error),
      });
    }
  }

  pinFolder(folder: Folder): void {
    this.folderPinned.emit(folder);
  }

  togglePinFolder(folder: Folder) {
    const index = this.pinnedFolders.findIndex((f) => f.id === folder.id);
    if (index === -1) {
      this.pinnedFolders.push(folder);
    } else {
      this.pinnedFolders.splice(index, 1);
    }
  }

  isPinned(folder: Folder): boolean {
    return this.pinnedFolders.some((f) => f.id === folder.id);
  }

  openModalDoc(): void {
    const modalRef = this.modalService.open(DocumentCreationComponent);
    modalRef.componentInstance.folderId = this.fId;
    modalRef.componentInstance.parentId = this.folder.parentId;
    console.log(' folderId from ddoc creation :', this.fId);
    console.log(' parentid from ddoc creation', this.folder.parentId);
    // console.log('type:' , this.folder.type);
    modalRef.componentInstance.documentCreated.subscribe(
      (newDoc: DocumentModel) => {
        //  this.documents = [...this.documents, newDoc];
        console.log('New document created:', newDoc);
      }
    );
  }
  openFolderCreationModal(): void {
    const modalRef = this.modalService.open(FolderCreationComponent);
    modalRef.componentInstance.folderId = this.fId;
    //modalRef.componentInstance.parentId = this.folder?.id;
    console.log('Passing folderId  fId  to modal:', this.fId);
    console.log('passing parentid', this.folder.parentId);
    modalRef.componentInstance.folderCreated.subscribe((newFolder: Folder) => {
      this.folders = [...this.folders, newFolder];
    });
  }
}
