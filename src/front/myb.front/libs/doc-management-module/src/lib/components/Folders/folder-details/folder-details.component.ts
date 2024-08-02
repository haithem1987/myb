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
import { filter, map, Observable, switchMap } from 'rxjs';
import { RootFolder } from '../../../models/RootFolder';
import { FolderEditComponent } from '../Edit/folder-edit.component';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';

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
  // @Input() parentId!: number;
  @Input() canCreateFolder = true;
  @Input() moduleName!: string;
  userId!: string;
  rootId!: number;

  //documents: DocumentModel[] = [];
  folder: any;
  folderName!: string;
  folders: Folder[] = [];
  pinnedFolders: Folder[] = [];

  folders$: Observable<Folder[]> = this.folderService.folders$.pipe(
    map((folders) => folders.filter((folder) => folder.parentId === this.fId))
  );

  documents$: Observable<DocumentModel[]> = this.documentService.documents$;

  @Output() folderPinned = new EventEmitter<Folder>();

  constructor(
    private route: ActivatedRoute,
    private folderService: FolderService,
    private documentService: DocumentService,
    private modalService: NgbModal,
    private toastService: ToastService,
    private router: Router,
    private RootFolderService: RootFolderService,
    private keycloakService: KeycloakService
  ) {}


  // ngOnInit(): void {
  //   this.keycloakService.userId$.subscribe((userId) => {
  //     if (userId) {
  //       this.userId = userId;
  //       console.log('User ID:', this.userId);
  //       console.log('module name ', this.moduleName);

  //       this.getRootFolder(userId, this.moduleName);

  //       // if (this.fId) {
  //       //   this.loadFolderDetails();
  //       //   this.loadFoldersByParentId(this.fId);
  //       // } else {
  //       //   this.route.paramMap.subscribe((params) => {
  //       //     this.fId = +params.get('id')!;
  //       //     this.loadFolderDetails();
  //       //   });
  //       // }
  //     }
  //   });
  //   console.log('ngOnInit FolderDetailsComponent');
  // }

  // getRootFolder(userId: string, moduleName: string) {
  //   this.RootFolderService.getRootFolderByUserIdAndModuleName(
  //     userId,
  //     moduleName
  //   ).subscribe({
  //     next: (data: RootFolder) => {
  //       console.log('RootFolder:', data);
  //       if (data == null) {
  //         const folder = {
  //           folderName: 'root',
  //           parentId: 0,
  //           createdBy: '',
  //           editedBy: '',
  //           createdAt: new Date(),
  //           updatedAt: new Date(),
  //         } as Folder;
  //         this.folderService.create(folder).subscribe({
  //           next: (newFolder) => {
  //             console.log('creation id', newFolder.id);
  //             console.log('creation parentId:', newFolder.parentId);
  //             console.log('first', this.folderService.folders$);

  //             const rootFolder = {
  //               moduleName: moduleName,
  //               userId: userId,
  //               folderId: newFolder.id,
  //             } as RootFolder;
  //             this.RootFolderService.create(rootFolder).subscribe({
  //               next: (rootFolder) => {
  //                 console.log('rootfolder', rootFolder.folderId);
  //                 console.log('userid', rootFolder.userId);
  //                 console.log('modulename', rootFolder.moduleName);
  //                 this.rootId = rootFolder.folderId;
  //                 this.fId = rootFolder.folderId;

  //                 this.openFolder(rootFolder.folderId);
  //               },
  //             });
  //           },
  //           error: (error) => {
  //             console.error('Error creating folder:', error);
  //           },
  //         });
  //       } else {
  //         this.rootId = data.folderId;
  //         this.fId = data.folderId;

  //         this.openFolder(data.folderId);
  //       }
  //     },
  //     error: (error) => {
  //       console.error('Error fetching root folder:', error);
  //     },
  //   });
  // }
  //2
  // ngOnInit(): void {
  //   this.keycloakService.userId$.subscribe((userId) => {
  //     if (userId) {
  //       this.userId = userId;
  //       console.log('User ID:', this.userId);
  //       console.log('Module name:', this.moduleName);
  
  //       this.getRootFolder(userId, this.moduleName);
  //     }
  //   });
  //   console.log('ngOnInit FolderDetailsComponent');
  // }
  
  // getRootFolder(userId: string, moduleName: string) {
  //   this.RootFolderService.getRootFolderByUserIdAndModuleName(userId, moduleName).subscribe({
  //     next: (data: RootFolder) => {
  //       console.log('RootFolder:', data);
  //       if (data == null) {
  //         this.createRootFolder(userId, moduleName);
  //       } else {
  //         this.rootId = data.folderId;
  //         this.fId = data.folderId;
  //         this.openFolder(data.folderId);
  //       }
  //     },
  //     error: (error) => {
  //       console.error('Error fetching root folder:', error);
  //     },
  //   });
  // }
  
  // createRootFolder(userId: string, moduleName: string) {
  //   const folder = {
  //     folderName: 'root',
  //     parentId: 0,
  //     createdBy: '',
  //     editedBy: '',
  //     createdAt: new Date(),
  //     updatedAt: new Date(),
  //   } as Folder;
  
  //   this.folderService.create(folder).subscribe({
  //     next: (newFolder) => {
  //       console.log('Creation ID:', newFolder.id);
  //       console.log('Creation parentId:', newFolder.parentId);
  
  //       const rootFolder = {
  //         moduleName: moduleName,
  //         userId: userId,
  //         folderId: newFolder.id,
  //       } as RootFolder;
  
  //       this.RootFolderService.create(rootFolder).subscribe({
  //         next: (rootFolder) => {
  //           console.log('RootFolder:', rootFolder.folderId);
  //           console.log('UserID:', rootFolder.userId);
  //           console.log('ModuleName:', rootFolder.moduleName);
  //           this.rootId = rootFolder.folderId;
  //           this.fId = rootFolder.folderId;
  
  //           this.openFolder(rootFolder.folderId);
  //         },
  //         error: (error) => {
  //           console.error('Error creating root folder:', error);
  //         },
  //       });
  //     },
  //     error: (error) => {
  //       console.error('Error creating folder:', error);
  //     },
  //   });
  // }
  //3
  ngOnInit(): void {
    this.keycloakService.userId$
      .pipe(
        filter((userId) => !!userId),
        switchMap((userId) => {
          this.userId = userId!;
          console.log('User ID:', this.userId);
          console.log('Module name:', this.moduleName);
  
          return this.getRootFolder(userId!, this.moduleName);
        })
      )
      .subscribe({
        next: (rootFolder) => {
          if (!rootFolder) {
            this.createRootFolderAndFolder(this.userId, this.moduleName);
          } else {
            this.rootId = rootFolder.folderId!;
            this.fId = rootFolder.folderId!;
           this.openFolder(rootFolder.folderId!);
          }
        },
        error: (error) => {
          console.error('Error fetching root folder:', error);
        },
      });
  }
  
  getRootFolder(userId: string, moduleName: string): Observable<RootFolder | null> {
    return this.RootFolderService.getRootFolderByUserIdAndModuleName(userId, moduleName).pipe(
      map((data: RootFolder | null) => {
        console.log('RootFolder:', data);
        return data;
      })
    );
  }
  
  createRootFolderAndFolder(userId: string, moduleName: string) {
    const folder = {
      folderName: 'root',
      parentId: 0,
      createdBy: '',
      editedBy: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Folder;
  
    this.folderService.create(folder).subscribe({
      next: (newFolder) => {
        console.log('Created Folder:', newFolder);
  
        const rootFolder = {
          moduleName: moduleName,
          userId: userId,
          folderId: newFolder.id,
        } as RootFolder;
  
        this.RootFolderService.create(rootFolder).subscribe({
          next: (createdRootFolder) => {
            console.log('Created RootFolder:', createdRootFolder);
            this.rootId = createdRootFolder.folderId!;
            this.fId = createdRootFolder.folderId!;
            this.openFolder(createdRootFolder.folderId!); // Open the newly created root folder
          },
          error: (error) => {
            console.error('Error creating root folder:', error);
          },
        });
      },
      error: (error) => {
        console.error('Error creating folder:', error);
      },
    });
  }
  
  openFolder(folderId: number): void {
    this.fId = folderId;
    this.loadFolderDetails();
    console.log('OpenFolder:', folderId, this.fId);
    console.log('This.documents$', this.documents$);
    console.log('FID:', this.fId, 'FolderID:', folderId);
  }
  
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

  // openFolder(folderId: number): void {
  //   this.fId = folderId;
  //   this.loadFolderDetails();
  //   // this.loadFoldersByParentId(this.fId);
  //   console.log('openflder', folderId, this.fId);
  //   console.log('this.documents$', this.documents$);

  //   console.log('fid', this.fId, 'folderId', folderId);
  // }

  goBackToPreviousFolder(): void {
    if (this.fId !== this.rootId) {
      this.fId = this.folder.parentId;
      this.loadFolderDetails();
      //this.loadFoldersByParentId(this.fId);
      console.log('first', this.folder);
    }
  }

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

  deleteDocument(docId: number) {
    this.documentService.delete(docId).subscribe(() => {
      console.log('doc deleted');
      this.toastService.show('Document Deleted successfully!', {
        classname: 'bg-success text-light ',
      });
    });
  }

  openEditFolder(Folder: Folder) {
    // const modalRef = this.modalService.open(FolderEditComponent);
    // modalRef.componentInstance.folder = { ...Folder };
    // modalRef.componentInstance.folderUpdated.subscribe(
    //   (updatedFolder: Folder) => {
    //     const index = this.folders.findIndex(
    //       (folder) => folder.id === updatedFolder.id
    //     );
    //     if (index !== -1) {
    //       this.folders[index] = updatedFolder;
    //     }
    //   }
    // );
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
     modalRef.componentInstance.parentId = this.folder?.id;
    console.log('Passing folderId  fId  to modal:', this.fId);
    console.log('passing parentid', this.folder.parentId);
    modalRef.componentInstance.folderCreated.subscribe((newFolder: Folder) => {
      this.folders = [...this.folders, newFolder];

    });
  }
}
