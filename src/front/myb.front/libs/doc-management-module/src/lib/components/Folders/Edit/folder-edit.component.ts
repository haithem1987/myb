import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Folder } from '../../../models/Folder';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

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

  constructor(public activeModal: NgbActiveModal){
    
  }
  //folder edit
  // editFolder(): void {
  //   if (this.folderName) {
  //     const folder = {
  //       id: 0, 
  //       folderName: this.folderName,
  //       parentId: 0,
  //       createdBy: 0,
  //       editedBy: 0 ,
       
  //     };
      
  //     this.folderEdit.emit(folder);
  //     this.activeModal.close();
  //   } else {
  //     alert('Please enter a folder name');
  //   }
  // }
}
