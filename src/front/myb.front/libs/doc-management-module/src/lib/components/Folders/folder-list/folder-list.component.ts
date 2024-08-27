import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FolderService } from '../../../services/folder.service';
import { Folder } from '../../../models/Folder';
import { DocumentModel } from '../../../models/DocumentModel';
import { ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FolderEditComponent } from '../Edit/folder-edit.component';
import { FormsModule } from '@angular/forms';
import { FolderCreationComponent } from '../folder-creation/folder-creation.component';
import { map, Observable } from 'rxjs';
import { FolderDetailsComponent } from '../folder-details/folder-details.component';

@Component({
  selector: 'myb-front-folder-list',
  standalone: true,
  imports: [CommonModule, RouterLink,FolderDetailsComponent],
  templateUrl: './folder-list.component.html',
  styleUrl: './folder-list.component.css',
})
export class FolderListComponent implements OnInit {
  @Input() folders: Folder[] = [];
  @Input() documents: DocumentModel[] = [];
  @Output() folderUpdated = new EventEmitter<Folder>();
  @Output() folderDeleted = new EventEmitter<number>();
  @Output() folderPinned = new EventEmitter<Folder>();


  // List to store pinned folders
  pinnedFolders: Folder[] = [];
  fId!: number;
  folder: any;
  folderName!: string;
  @Input() parentId!: number;


  constructor(
    private route: ActivatedRoute,

    private folderService: FolderService, 
    private modalService: NgbModal
  ) {}
  folders$: Observable<Folder[]> = this.folderService.folders$.pipe(
    map(folders => folders.filter(folder => folder.parentId === null))
  );
  
  ngOnInit():void {
    
  

  }

  
  loadFolders() {
    this.folderService.getAll().subscribe({
      next: (data: Folder[]) => {
        this.folders = data;
      },
      error: (error) => {
        console.error('Error loading folders', error);
      },
      complete: () => {
        console.log('Folders loading completed');
      }
    });
  }


  openModal(): void {
    const modalRef = this.modalService.open(FolderCreationComponent);
    modalRef.componentInstance.folderId = this.fId;
    modalRef.componentInstance.parentId = this.folder?.parentId;
    console.log('Passing folderId to modal:', this.fId);
    console.log('Loading parentid', this.folder.parentId);
    modalRef.componentInstance.folderCreated.subscribe(
      (newFolder: Folder) => {
        this.folders = [...this.folders, newFolder];

  
    });
  }
  
  pinFolder(folder: Folder): void {
    this.folderPinned.emit(folder);
  }

  deleteFolder(id: number) {
    if (id == -1) {
      return;
    }
    this.folderService.delete(id).subscribe(() => {
      this.folderDeleted.emit(id);
    });
    
  }


  openModalEdit() {
    const modalRef = this.modalService.open(FolderEditComponent);
    modalRef.componentInstance.folderEdit.subscribe((updateFolder: Folder) => {
      this.folders = [...this.folders, updateFolder]; 
    });
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
  
}
