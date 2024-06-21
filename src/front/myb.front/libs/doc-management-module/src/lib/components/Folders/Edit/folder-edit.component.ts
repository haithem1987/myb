import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Folder } from '../../../models/Folder';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { FolderService } from '../../../services/folder.service';

@Component({
  selector: 'myb-front-folder-edit',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './folder-edit.component.html',
  styleUrl: './folder-edit.component.css',
})
export class FolderEditComponent {

  @Output() folderEdit = new EventEmitter<Folder>();
  folderName: string = '';

  constructor(
    public activeModal: NgbActiveModal,
    private folderService: FolderService
  
  ){}

  //edit folder
  editFolder() {
    // if (this.folderName) {
    //   const updatedFolder = { ...this.folder, folderName: this.folderName };
    //   this.folderService.updateFolder(updatedFolder).subscribe((folder) => {
    //     this.folderEdit.emit(folder);
    //     this.activeModal.close();
    //   });
    // }
  }
  
}
