import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FolderService } from '../../../services/folder.service';
import { Folder } from '../../../models/Folder';

@Component({
  selector: 'myb-front-folder-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './folder-cards.component.html',
  styleUrl: './folder-cards.component.css',
})
export class FolderCardsComponent  implements OnInit {
folders:Folder[] = []

  constructor( private folderService: FolderService) {}


  ngOnInit() {
    this.loadFolders();
  }

  loadFolders() {
    this.folderService.getAll().subscribe((data: any) => {
      console.log("Received folders from server:", data);
      
      if (Array.isArray(data)) {
        this.folders = data;
      } else {
        console.error("Invalid data format received from the server");
      }
    }, (error) => {
      console.error("Error loading folders", error);
  });
  }
  getDocumentCount(folder: Folder): number {
    return folder.documents ? folder.documents.length : 0;
  }
  
}
