import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Folder } from '../../../models/Folder';
import { FormsModule } from '@angular/forms';
import { FolderService } from '../../../services/folder.service';

@Component({
  selector: 'myb-front-folder-creation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './folder-creation.component.html',
  styleUrl: './folder-creation.component.css',
})
export class FolderCreationComponent {
  folderName: string = '';
  @Output() folderCreated = new EventEmitter<Folder>();

  constructor(public activeModal: NgbActiveModal, private folderService: FolderService) {}

  createFolder(): void {
    if (this.folderName) {
      const folder = {
        id: 0, 
        folderName: this.folderName,
        parentId: 0,
        createdBy: 0,
        editedBy: 0 ,
       
      };
      
      this.folderService.createFolder(folder).subscribe(
        (newFolder) => {
          this.folderCreated.emit(newFolder);
          this.activeModal.close();
          console.log('folder created',newFolder)
        },
        (error) => {
          console.error('Error creating folder:', error);
        }
      );
    } else {
      alert('Please enter a folder name');
    }
  }
}

