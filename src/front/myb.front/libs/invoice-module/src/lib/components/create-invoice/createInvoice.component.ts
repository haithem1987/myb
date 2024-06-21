import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { InvoiceService } from '../../services/invoice.service';
import {
  SelectedFiles,
  UploadFilesService,
} from '../../services/upload-files.service';
import { Invoice } from '../../models/invoice.model';
import {
  FormGroup,
  ReactiveFormsModule,
  FormControl,
  Validators,
} from '@angular/forms';
import { DateUtilsService } from '../../../../../shared/infra/services/date-utils.service';
import { ToastService } from '../../../../../shared/infra/services/toast.service';
import { HttpClientModule } from '@angular/common/http';
import { OcrService } from '../../../../../shared/infra/services/ocr.service';
import { NgbScrollSpyModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'myb-front-create-invoice',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgbScrollSpyModule,
    RouterLink
  ],
  templateUrl: './createInvoice.component.html',
  styleUrl: './createInvoice.component.css',
})
export class CreateInvoiceComponent {
  invoiceForm: FormGroup = new FormGroup({
    invoiceNum: new FormControl(''),
    createdAt: new FormControl(new Date('2024-06-01T08:00:00Z')),
    updatedAt: new FormControl(new Date('2024-06-01T08:00:00Z')),
    invoiceDate: new FormControl(new Date('2024-06-01T08:00:00Z')),
    dueDate: new FormControl(new Date('2024-06-01T08:00:00Z')),
    clientName: new FormControl(''),
    clientAddress: new FormControl(''),
    supplierName: new FormControl(''),
    supplierAddress: new FormControl(''),
    status: new FormControl(''),
    totalAmount: new FormControl(0),
    subTotal: new FormControl(0),
  });
  selectedFile: File | null = null;
  selectedFiles: SelectedFiles[] = [];
  extractedText: string = '';
  extractedTexts: string[] = [];

  @Input() name?: string;

  private invoiceService = inject(InvoiceService);
  private dateUtils = inject(DateUtilsService);
  private files = inject(UploadFilesService);
  private toastService = inject(ToastService);
  private ocrService = inject(OcrService);

  constructor() {}

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
        'image/JPEG',
      ];
      // if (!_.includes(allowed_types, file.type)) {
      //   this.imageError = 'Only PDF are allowed ( PDF )';
      //   this.genService.openSnackBar(this.imageError);

      //   return false;
      // }
    }
    //this.preformOcr(fileInput.target);
    this.files.toBase64(filesData, this.selectedFiles).subscribe((res) => {
      if (res) {
        if (res.length > 10) {
          let fileList = [];
          for (let index = 0; index < 10; index++) {
            fileList.push(res[index]);
          }
          this.selectedFiles = fileList;
          
          // this.genService.openSnackBar('Maximum no. of 10 Media items can be uploaded.');
        } else {
          this.selectedFiles = res;
          //////////////////////////////////////////////// fic selected files multi files
          this.preformOcr([res[0].file]);
          this.removeSelectedFilesImage(0);
        }
      }
    });
  }

  removeSelectedFilesImage(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  saveInvoice(): void {
    const newInvoice = new Invoice();
    newInvoice.invoiceNum = this.invoiceForm.value.invoiceNum;
    newInvoice.createdAt = this.invoiceForm.value.createdAt;
    newInvoice.updatedAt = this.invoiceForm.value.updatedAt;
    newInvoice.invoiceDate = this.invoiceForm.value.invoiceDate;
    newInvoice.dueDate = this.invoiceForm.value.dueDate;
    newInvoice.status = this.invoiceForm.value.status;
    newInvoice.totalAmount = this.invoiceForm.value.totalAmount;
    newInvoice.subTotal = this.invoiceForm.value.subTotal;
    newInvoice.clientName = this.invoiceForm.value.clientName;
    newInvoice.clientAddress = this.invoiceForm.value.clientAddress;
    newInvoice.supplierName = this.invoiceForm.value.supplierName;
    newInvoice.supplierAddress = this.invoiceForm.value.supplierAddress;
    console.log('invoice', newInvoice);

    this.invoiceService.create(newInvoice).subscribe(() => {
      this.toastService.show('Invoice created successfully!', {
        classname: 'bg-success text-light',
      });
    });
  }

  preformOcr(files: File[]) {
    this.ocrService.performOCR(files).subscribe(
      (response) => {
        console.log('ocr responce', response);
        this.extractedText = response[0].text;
        this.extractedTexts = this.extractedText.split('\n');
        console.log('extracted text', this.extractedTexts);
      },
      (error) => {
        console.error('Error performing OCR:', error);
      }
    );
  }
  closeOcr(){
    this.extractedText = '';
  }
}
