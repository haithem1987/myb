import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FolderService } from '../../../services/folder.service';
import { Folder } from '../../../models/Folder';
import { DocumentModel } from '../../../models/DocumentModel';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FolderEditComponent } from '../Edit/folder-edit.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'myb-front-folder-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './folder-list.component.html',
  styleUrl: './folder-list.component.css',
})
export class FolderListComponent {
  @Input() folders: Folder[] = [];
  @Input() documents: DocumentModel[] = [];
  @Output() folderUpdated = new EventEmitter<Folder>();
  @Output() folderDeleted = new EventEmitter<number>();

  constructor(private folderService: FolderService,    private modalService: NgbModal, ) {}

  deleteFolder(id: number) {
    if (id == -1) {
      return;
    }
    this.folderService.delete(id).subscribe(() => {
      this.folderDeleted.emit(id);
    });
  }

  updateFolder(folder: Folder) {
    this.folderService.update(folder.id, folder).subscribe(
      (updatedFolder) => {
        this.folderUpdated.emit(updatedFolder);
      },
      (error) => {
        console.error('Error updating folder:', error);
      }
    );
  }
  openModal() {
    const modalRef = this.modalService.open(FolderEditComponent);
    modalRef.componentInstance.folderEdit.subscribe((newFolder: Folder) => {
      this.folders = [...this.folders, newFolder]; 
    });
  }
  
  // getUrl(file: any){
  //   const reader = new FileReader();
  //   reader.readAsDataURL(file);
  //   return URL.createObjectURL(file);

  // }
 
}
