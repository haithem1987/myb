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
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DocumentUploadComponent } from '../../document-upload/document-upload.component';
import { DocumentEditComponent } from '../../Documents/document-edit/document-edit.component';
import { FormsModule } from '@angular/forms';
import { Folder } from '../../../models/Folder';
import { FolderCreationComponent } from '../folder-creation/folder-creation.component';
import { DocumentCreationComponent } from '../../document-creation/document-creation.component';
import { filter, map, Observable, switchMap, take } from 'rxjs';
import { RootFolder } from '../../../models/RootFolder';
import { FolderEditComponent } from '../Edit/folder-edit.component';
import { KeycloakProfile } from 'keycloak-js';
import { DownloadFilesService } from '../../../services/download-files.service';
import { NoResultComponent } from '@myb-front/shared-ui';
import { KeycloakService } from 'libs/auth/src/lib/keycloak.service';
import { ToastService } from 'libs/shared/infra/services/toast.service';

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
  @Input() title!: string;
  @Input() canCreateFolder = true;
  @Input() moduleName!: string;
  userId!: string;
  rootId!: number;

  folder: any;
  folderName!: string;
  folders: Folder[] = [];
  pinnedFolders: Folder[] = [];

  folders$: Observable<Folder[]> = this.folderService.folders$.pipe(
    map((folders) => folders.filter((folder) => folder.parentId === this.fId))
  );

  documents$: Observable<DocumentModel[]> = this.documentService.documents$;
  user$: Observable<KeycloakProfile | null>;

  @Output() folderPinned = new EventEmitter<Folder>();
  CanView=false;

  constructor(
    private folderService: FolderService,
    private documentService: DocumentService,
    private modalService: NgbModal,
    private toastService: ToastService,
    private RootFolderService: RootFolderService,
    private keycloakService: KeycloakService,
    private downloadService: DownloadFilesService
  ) {
    this.user$ = this.keycloakService.profile$;
  }

  ngOnInit(): void {
    this.CanView = this.keycloakService.hasRole('Myb_Manger_Doc');

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
 
  //RootFolder
  getRootFolder(userId: string,moduleName: string): Observable<RootFolder | null> {
    return this.RootFolderService.getRootFolderByUserIdAndModuleName(userId,moduleName).pipe(
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
        this.openFolder(newFolder.id);

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

  //folders
  openFolder(folderId: number): void {
    this.fId = folderId;
    
    this.loadFolderDetails();
    console.log('OpenFolder:', folderId, this.fId);
    console.log('This.documents$', this.documents$);
    console.log('foldername', this.folderName);
    console.log('this.folders$', this.folders$);
  }

  loadFolders() {
    if(this.CanView){
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
  }

  
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
        if (data) {
          this.folder = data;
          this.folderName = data.folderName;
          console.log('Folder details:', data);
          console.log('Folder details:', data.id, this.fId);
        } else {
          console.error('Folder data is undefined');
        }
      },
      error: (error) => {
        console.error('Error fetching folder details:', error);
      },
    });
  }

  deleteFolder(id: number): void {
    if (confirm('Are you sure you want to delete this folder?')) {
      this.folderService.delete(id).subscribe({
        next: () => {
          console.log('Folder deleted');
        },
        error: (error) => console.error('Error deleting folder', error),
      });
    }
  }

  // Documents
  deleteDocument(docId: number) {
    this.documentService.delete(docId).subscribe(() => {
      console.log('doc deleted');
      this.toastService.show('Document Deleted successfully!', {
        classname: 'bg-success text-light ',
      });
    });
  }

  downloadDocument(document: DocumentModel): void {
    if (document.file && document.documentName) {
      this.downloadService.downloadDocument(
        document.file,
        document.documentName
      );
    } else {
      console.error('File data or document name is undefined.');
    }
  }
  viewDocument(document: DocumentModel): void {
    if (document.file && document.documentName) {
      this.downloadService.viewDocument(document.file, document.documentName);
    } else {
      console.error('File data or document name is undefined.');
    }
  }

  //Folders Pin
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

  //Modals
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
  openEditFolder(folder: Folder) {
    const modalRef = this.modalService.open(FolderEditComponent);
    modalRef.componentInstance.folder = { ...folder };
    modalRef.componentInstance.folderUpdated.subscribe(
      (updatedFolder: Folder) => {
        this.folders$.pipe(take(1)).subscribe((folders) => {
          const index = this.folders.findIndex(
            (f) => f.id === updatedFolder.id
          );
          if (index !== -1) {
            const updatedfolders = [...folders];
            updatedfolders[index] = updatedFolder;
            // this.folders[index] = updatedFolder;
            //this.folderService.update(updatedFolder.id, updatedFolder);
          }
        });
      }
    );
  }

  openModal(document?: DocumentModel) {
    const modalRef = this.modalService.open(DocumentEditComponent);
    modalRef.componentInstance.document = { ...document };
    modalRef.componentInstance.documentUpdated.subscribe(
      (updatedDocument: DocumentModel) => {
        this.documents$.pipe(take(1)).subscribe((documents) => {
          const index = documents.findIndex(
            (doc: DocumentModel) => doc.id === updatedDocument.id
          );
          if (index !== -1) {
            const updatedDocuments = [...documents];
            updatedDocuments[index] = updatedDocument;
          }
        });
      }
    );
  }
}
