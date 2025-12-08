import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FolderCardsComponent } from '../folder-cards/folder-cards.component';
import { NavLinksComponent } from '../../navigation-components/nav-links/nav-links.component';
import { Folder } from '../../../models/Folder';
import { DocumentModel } from '../../../models/DocumentModel';
import { FolderListComponent } from '../folder-list/folder-list.component';

@Component({
  selector: 'myb-front-folder-index',
  standalone: true,
  imports: [CommonModule, RouterOutlet,FolderCardsComponent,NavLinksComponent,FolderListComponent],
  templateUrl: './folder-index.component.html',
  styleUrl: './folder-index.component.css',
})
export class FolderIndexComponent {
  folders: Folder[] = [];
  documents: DocumentModel[] = [];
  @Output() folderCreated = new EventEmitter<Folder>();
  @Output() documentCreated = new EventEmitter<DocumentModel>();
  pinnedFolders: Folder[] = [];
}
