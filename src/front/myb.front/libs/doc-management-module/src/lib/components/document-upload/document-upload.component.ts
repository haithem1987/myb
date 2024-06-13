import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentModel } from '../../models/DocumentModel';
import { DocumentStatus } from '../../models/DocumentStatus';
import { DocumentService } from '../../services/Document.service';
import { Folder } from '../../models/Folder';
import { BehaviorSubject } from 'rxjs';
import { SafePipe } from '../../services/safe.pipe';
import { SelectedFiles, UploadFilesService } from '../../services/upload-files.service';

@Component({
  selector: 'myb-front-document-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-upload.component.html',
  styleUrl: './document-upload.component.css',
})
export class DocumentUploadComponent {

  selectedFile: File | null = null;
  documents: DocumentModel[] = [];
  folders:Folder[] = []

  selectedFiles: SelectedFiles[] = [];
  @Output() selectedFilesChange = new EventEmitter<SelectedFiles[]>();

  constructor(private files :UploadFilesService) {}
  

  onSelectFile(filesData: any, fileInput: any) {
    const { files } = fileInput.target;
      const file = files[0];
      if (files && file) {
        // Size Filter Bytes
        const allowed_types = [
          'application/pdf', 
          'application/x-pdf', 
          'application/x-bzpdf', 
          'application/x-gzpdf', 
          'image/png', 
          'image/jpeg', 
          'image/jpg', 
          'image/JPG', 
          'image/JPEG'];
      }
      
    this.files.toBase64(filesData, this.selectedFiles).subscribe((res) => {
      if (res) {
       
        if(res.length > 10){
          let fileList = [];
          for (let index = 0; index < 10; index++) {
            fileList.push(res[index]);
          }
          this.selectedFiles = fileList;
        }
        else{
          this.selectedFiles = res;
        }
      }
      console.log('upload component',files)
    });
  }

  removeSelectedFilesImage(index: number) {
    this.selectedFiles.splice(index, 1);
  }

}