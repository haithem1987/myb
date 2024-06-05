import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { InvoiceService } from '../../services/invoice.service';
import {
  SelectedFiles,
  UploadFilesService,
} from '../../services/upload-files.service';
import { Invoice } from '../../models/invoice.model';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DateUtilsService } from '../../../../../shared/infra/services/date-utils.service';
import { ToastService } from '../../../../../shared/infra/services/toast.service';
import { HttpClientModule } from '@angular/common/http';
import { OcrService } from '../../../../../shared/infra/services/ocr.service';

@Component({
  selector: 'myb-front-create-invoice',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './createInvoice.component.html',
  styleUrl: './createInvoice.component.css',
})
export class CreateInvoiceComponent {
  invoiceForm: FormGroup;
  selectedFile: File | null = null;
  public selectedFiles: SelectedFiles[] = [];
  activeModal = inject(NgbActiveModal);

  @Input() name?: string;

  private invoiceService = inject(InvoiceService);
  private dateUtils = inject(DateUtilsService);
  private files = inject(UploadFilesService);
  private formBuilder = inject(FormBuilder);
  private toastService = inject(ToastService);
  private ocrService = inject(OcrService);

  constructor() {
    this.invoiceForm = this.formBuilder.group({
      id: [0],
      invoiceNum: [''],
      invoiceDate: [null],
      subTotal: [0],
      totalAmount: [0],
      dueDate: [null],
      status: [''],
      createdAt: [null],
      updatedAt: [null],
      clientName: [''],
      clientAddress: [''],
      supplierName: [''],
      supplierAddress: [''],
      userId: [1],
      companyId: [1],
      image: [''],
    });
  }

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
          this.preformOcr([res[0].file]);
          console.log('file name', res[0].ImageName);
        }
      }
    });
  }

  removeSelectedFilesImage(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  saveInvoice(): void {
    const newInvoice = new Invoice();
    newInvoice.invoiceNum = '9';
    newInvoice.createdAt = new Date('2024-06-01T08:00:00Z');
    newInvoice.updatedAt = new Date('2024-06-01T08:00:00Z');
    newInvoice.invoiceDate = new Date('2024-06-01T08:00:00Z');
    newInvoice.dueDate = new Date('2024-06-01T08:00:00Z');
    newInvoice.status = 'unpayed';
    newInvoice.totalAmount = 900.0;
    newInvoice.subTotal = 700.0;
    newInvoice.clientName = 'x';
    newInvoice.clientAddress = 'x';
    newInvoice.supplierName = 'y';
    newInvoice.supplierAddress = 'y';
    console.log('invoice', newInvoice);

    this.invoiceService.create(newInvoice).subscribe(() => {
      /* this.toastService.show('Invoice created successfully!', {
          classname: 'bg-success text-light',
        }); */
    });
  }

  preformOcr(files: File[]) {
    this.ocrService.performOCR(files).subscribe(
      (response) => {
        // handle OCR response
        console.log('ocr responce', response);
      },
      (error) => {
        console.error('Error performing OCR:', error);
      }
    );
  }
}
