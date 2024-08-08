import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TaxService } from '../../../services/tax.service';
import { Observable } from 'rxjs';
import { Tax } from '../../../models/tax.model';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateTaxComponent } from '../create-tax/createTax.component';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from 'libs/shared/infra/services/toast.service';

@Component({
  selector: 'myb-front-list-tax',
  standalone: true,
  imports: [CommonModule, RouterLink,FormsModule,CreateTaxComponent,TranslateModule],
  templateUrl: './listTax.component.html',
  styleUrl: './listTax.component.css',
})
export class ListTaxComponent implements OnInit {
  private taxService = inject(TaxService);
  private modalService = inject(NgbModal);
  private toastService = inject(ToastService);
  taxes$: Observable<Tax[]> = this.taxService.taxes$;
  searchTerm: string = '';
  activeTab: string = 'ACTIVE';
  

  ngOnInit(): void {
    
  }
  openModal(): void {
    this.modalService.open(CreateTaxComponent);
    
  }
  setActiveTab(tab: 'ACTIVE' | 'ARCHIVED') {
    this.activeTab = tab;
  }

  archiveTax(tax : Tax){
    const updatedTax = {...tax, isArchived: true};
    this.taxService.update(tax.id, updatedTax).subscribe((response)=>{
      this.toastService.show('Tax archived successfully!', {
        classname: 'bg-success text-light',
      });
    });
  }
  restoreTax(tax : Tax){
    const updatedTax = {...tax, isArchived: false};
    this.taxService.update(tax.id, updatedTax).subscribe((response)=>{
      this.toastService.show('Tax restored successfully!', {
        classname: 'bg-success text-light',
      });
    });
  }
  showTax(tax: Tax) : boolean{
    var result = true;
    if(this.activeTab == 'ACTIVE' && tax.isArchived == true){
      return false;
    }
    if(this.activeTab == 'ARCHIVED' && tax.isArchived == false){
      return false;
    }
    if(tax.name!.toLowerCase().includes(this.searchTerm.toLowerCase())){
      result = true;
    }
    else{
      result = false;
    }

    return result;
  }

}
