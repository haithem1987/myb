import { CommonModule } from '@angular/common';
import { Component, Inject, inject, Input, OnInit } from '@angular/core';
import { InvoiceService } from '../../../services/invoice.service';
import {
  SelectedFiles,
  UploadFilesService,
} from '../../../services/upload-files.service';
import { Invoice } from '../../../models/invoice.model';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DateUtilsService } from '../../../../../../shared/infra/services/date-utils.service';
import { ToastService } from '../../../../../../shared/infra/services/toast.service';
import { HttpClientModule } from '@angular/common/http';
import { OcrService } from '../../../../../../shared/infra/services/ocr.service';
import {
  NgbDatepickerModule,
  NgbModal,
  NgbScrollSpyModule,
} from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterLink } from '@angular/router';
import { ClientService } from '../../../services/client.service';
import { ProductService } from '../../../services/product.service';
import { Observable } from 'rxjs';
import { Client } from '../../../models/client.model';
import { Product } from '../../../models/product.model';
import { SelectClientComponent } from './select-client/selectClient.component';
import { AddItemToInvoiceComponent } from './add-item/addItemToInvoice.component';
import { InvoiceDetails } from '../../../models/invoiceDetails.model';

@Component({
  selector: 'myb-front-create-invoice',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    NgbScrollSpyModule,
    RouterLink,
    ReactiveFormsModule,
    NgbDatepickerModule,
    SelectClientComponent,
    AddItemToInvoiceComponent,
  ],
  templateUrl: './createInvoice.component.html',
  styleUrl: './createInvoice.component.css',
})
export class CreateInvoiceComponent {
  private clientService = inject(ClientService);
  private invoiceService = inject(InvoiceService);
  private dateUtils = inject(DateUtilsService);
  private toastService = inject(ToastService);
  modalService = inject(NgbModal);
  fb = inject(FormBuilder);
  private router = inject(Router);

  clients$: Observable<Client[]> = this.clientService.clients$;

  client?: Client;
  clientInvalid: String = '';

  invoiceDetails: InvoiceDetails[] = [];
  invoiceDetailsInvalid: String = '';

  invoiceForm: FormGroup;

  constructor() {
    this.invoiceForm = this.fb.group({
      invoiceNum: ['', Validators.required],
      invoicedate: [null, Validators.required],
      dueDate: [null,Validators.required],
      // Add other form controls as necessary
    });
  }

  openClientsModal() {
    const modalRef = this.modalService.open(SelectClientComponent, {
      size: 'lg',scrollable: true
    });
    modalRef.componentInstance.clientEntered.subscribe((client: Client) => {
      if (client) {
        this.client = client;
      }
    });
  }

  openAddItemModal() {
    const modalRef = this.modalService.open(AddItemToInvoiceComponent, {
      size: 'lg',
    });
    modalRef.componentInstance.itemAdded.subscribe((item: InvoiceDetails) => {
      if (item) {
        this.invoiceDetails.push(item);
      }
    });
  }

  removeItem(item: InvoiceDetails) {
    this.invoiceDetails = this.invoiceDetails.filter(
      (invoiceDetails) => invoiceDetails != item
    );
  }

  save() {
    if (this.invoiceForm.valid && this.invoiceDetails.length > 0) {
      const invoiceDateControl = this.invoiceForm.get('invoicedate');
      const invoiceDateStruct = invoiceDateControl?.value;
      const invoiceDate = this.dateUtils.fromDateStruct(invoiceDateStruct);

      const dueDateControl = this.invoiceForm.get('dueDate');
      const dueDateStruct = dueDateControl?.value;
      const dueDate = this.dateUtils.fromDateStruct(dueDateStruct);

      const invoice = new Invoice();
      invoice.createdAt = new Date();
      invoice.updatedAt = new Date();
      invoice.clientID = this.client?.id;
      invoice.invoiceDate = invoiceDate;
      invoice.dueDate = dueDate;
      invoice.invoiceNum = this.invoiceForm.value.invoiceNum;
      invoice.invoiceDetails = this.invoiceDetails;
      invoice.totalAmount = this.getTotal(this.invoiceDetails);
      invoice.subTotal = this.getSubTotal(this.invoiceDetails);

      this.invoiceService.create(invoice).subscribe(() => {
        this.toastService.show('Client created successfully!', {
          classname: 'bg-success text-light',
        });
        this.router.navigate(['/invoice']);
      });
      
    } else {
      this.clientInvalid = 'Client is required!';
      this.invoiceDetailsInvalid = 'Invoice details is required!';
      this.invoiceForm.markAllAsTouched();
    }
  }

  getTotal(invoiceDetails: InvoiceDetails[]){
    var total = 0;
    for(var item of invoiceDetails){
      total += (item.unitPrice! * item.quantity!);
    }
    return total;
  }

  getSubTotal(invoiceDetails: InvoiceDetails[]){
    var total = 0;
    for(var item of invoiceDetails){
      total += (item.unitPriceHT! * item.quantity!);
    }
    return total;
  }

  /* onSelectFile(filesData: any, fileInput: any) {
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
  } */
}
