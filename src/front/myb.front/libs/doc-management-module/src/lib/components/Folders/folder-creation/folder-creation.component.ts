import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Folder } from '../../../models/Folder';
import { FormsModule } from '@angular/forms';
import { FolderService } from '../../../services/folder.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';


@Component({
  selector: 'myb-front-folder-creation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './folder-creation.component.html',
  styleUrl: './folder-creation.component.css',
})
export class FolderCreationComponent  {
  folderName: string = '';
  @Input()  parentId!: number;
  @Output() folderCreated = new EventEmitter<Folder>();
  @Input() folderId!: number;

  constructor(
    public activeModal: NgbActiveModal,
    private folderService: FolderService,
    private route: ActivatedRoute,
  ) {}
  ngOnInit() {
    console.log('Received folderId from details:', this.folderId);
    console.log('Received parentid from details:', this.parentId);
  }

  createFolder(): void {
    if (this.folderName) {
      // const parentId = this.folderId === this.folderId ? this.folderId : null;

      const folder = {
        folderName: this.folderName,
        parentId: this.folderId, 
        createdBy: 0,
        editedBy: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.folderService.createFolder(folder).subscribe(
        
        (newFolder) => {
          this.folderCreated.emit(newFolder);
          this.activeModal.close();
          console.log('creation  id', newFolder.id);
          console.log('creation parentId:', newFolder.parentId);
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

