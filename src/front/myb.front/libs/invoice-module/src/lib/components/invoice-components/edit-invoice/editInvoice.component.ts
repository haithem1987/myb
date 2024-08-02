import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { InvoiceService } from '../../../services/invoice.service';
import { SelectedFiles, UploadFilesService } from '../../../services/upload-files.service';

@Component({
  selector: 'myb-front-edit-invoice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './editInvoice.component.html',
  styleUrl: './editInvoice.component.css',
})
export class EditInvoiceComponent {
  selectedFile: File | null = null;
  public selectedFiles: SelectedFiles[] = [];

  activeModal = inject(NgbActiveModal);

	@Input() name?: string;

  private invoiceService = inject(InvoiceService);
  private files = inject(UploadFilesService);

  onSelectFile(filesData: any, fileInput: any) {
    const { files } = fileInput.target;
      const file = files[0];
      if (files && file) {
        // Size Filter Bytes
        const allowed_types = ['application/pdf', 'application/x-pdf', 'application/x-bzpdf', 'application/x-gzpdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/JPG', 'image/JPEG'];
        // if (!_.includes(allowed_types, file.type)) {
        //   this.imageError = 'Only PDF are allowed ( PDF )';
        //   this.genService.openSnackBar(this.imageError);
 
        //   return false;
        // }
      }
    this.files.toBase64(filesData, this.selectedFiles).subscribe((res) => {
      if (res) {
       
        if(res.length > 10){
          let fileList = [];
          for (let index = 0; index < 10; index++) {
            fileList.push(res[index]);
          }
          this.selectedFiles = fileList;
          // this.genService.openSnackBar('Maximum no. of 10 Media items can be uploaded.');
 
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
