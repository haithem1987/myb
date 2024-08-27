import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FolderService } from '../../../services/folder.service';
import { Folder } from '../../../models/Folder';
import { RouterLink, RouterOutlet } from '@angular/router';
import { FolderDetailsComponent } from '../folder-details/folder-details.component';
import { DocumentModel } from '../../../models/DocumentModel';
import { DocumentUploadComponent } from '../../document-upload/document-upload.component';
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
  @Output() folderCreated = new EventEmitter<Folder>();
  @Output() documentCreated = new EventEmitter<DocumentModel>();
  pinnedFolders: Folder[] = [];

  constructor(
    private folderService: FolderService,    
  ) {}

  ngOnInit() {
    this.loadFolders();
    this.pinnedFolders = [];
 this.loadPinnedFolders();
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

 
pinFolder(folder: Folder): void {
  if (!this.isPinned(folder)) {
    this.pinnedFolders.push(folder);
    this.savePinnedFolders();
  }
}

unpinFolder(folder: Folder): void {
  this.pinnedFolders = this.pinnedFolders.filter(f => f.id !== folder.id);
  this.savePinnedFolders();
}

isPinned(folder: Folder): boolean {
  return this.pinnedFolders.some(f => f.id === folder.id);
}

onFolderPinned(folder: Folder): void {
  this.pinFolder(folder);
}

savePinnedFolders(): void {
  localStorage.setItem('pinnedFolders', JSON.stringify(this.pinnedFolders));
}

loadPinnedFolders(): void {
  const pinnedFolders = localStorage.getItem('pinnedFolders');
  if (pinnedFolders) {
    this.pinnedFolders = JSON.parse(pinnedFolders);
  }
}


}