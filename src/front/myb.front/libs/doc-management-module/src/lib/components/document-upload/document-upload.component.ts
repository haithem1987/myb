import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadFilesService } from '../../services/upload-files.service';
import { SelectedFiles } from '../../models/SelectedFiles';

@Component({
  selector: 'myb-front-document-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-upload.component.html',
  styleUrl: './document-upload.component.css',
})
export class DocumentUploadComponent {
  selectedFiles: SelectedFiles[] = [];

  @Output() selectedFilesChange = new EventEmitter<SelectedFiles[]>();

  constructor(private filesService: UploadFilesService) {}

  onSelectFile(filesData: any, fileInput: any) {
    const { files } = fileInput.target;
 
    this.filesService.toBase64(files, this.selectedFiles);
    this.filesService.getSelectedFiles().subscribe((res) => {
      if (res) {
        this.selectedFiles = res;
        this.selectedFilesChange.emit(this.selectedFiles);
      }
    });
  }
}
