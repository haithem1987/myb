import { Component } from '@angular/core';
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

  public selectedFiles: SelectedFiles[] = [];
  public isLoading = new BehaviorSubject(false);

  

  constructor(private documentService: DocumentService , private files :UploadFilesService) {}



  //alldoc
  loadDocuments() {
    this.documentService.getAll().subscribe((data: any) => {
      console.log("Received data from server:", data);
     // console.log('status ',this.documents);
      if (data && data.allDocuments && Array.isArray(data.allDocuments)) {
        this.documents = data.allDocuments;
      } else {
        console.error("Invalid data format received from the server");
      }
    });
  }
  
  onSelectFile(filesData: any, fileInput: any) {
    const { files } = fileInput.target;
      const file = files[0];
      if (files && file) {
        // Size Filter Bytes
        const allowed_types = ['application/pdf', 'application/x-pdf', 'application/x-bzpdf', 'application/x-gzpdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/JPG', 'image/JPEG'];
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
    });
  }

  removeSelectedFilesImage(index: number) {
    this.selectedFiles.splice(index, 1);
  }

}