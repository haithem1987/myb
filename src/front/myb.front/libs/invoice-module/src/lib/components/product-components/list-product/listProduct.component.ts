import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { Product } from '../../../models/product.model';
import { map, Observable } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateProductComponent } from '../create-product/createProduct.component';
import { FormsModule } from '@angular/forms';
import { TaxService } from '../../../services/tax.service';
import { Tax } from '../../../models/tax.model';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from 'libs/shared/infra/services/toast.service';

@Component({
  selector: 'myb-front-list-product',
  standalone: true,
  imports: [CommonModule, RouterLink,CreateProductComponent,FormsModule,TranslateModule],
  templateUrl: './listProduct.component.html',
  styleUrl: './listProduct.component.css',
})
export class ListProductComponent {
  private productService = inject( ProductService);
  private toastService = inject(ToastService);
  private modalService = inject(NgbModal);
  

  products$ : Observable<Product[]> = this.productService.products$;
  searchTerm: string = '';

  activeTab: string = 'ACTIVE';

  openModal() {
		this.modalService.open(CreateProductComponent, { size: 'lg' ,scrollable: true});
	}
  setActiveTab(tab: 'ACTIVE' | 'ARCHIVED') {
    this.activeTab = tab;
  }
  archiveProduct(product : Product){
    const updatedProduct = {...product, isArchived: true};
    this.productService.update(product.id, updatedProduct).subscribe((response)=>{
      this.toastService.show('Product archived successfully!', {
        classname: 'bg-success text-light',
      });
    });
  }
  restoreProduct(product : Product){
    const updatedProduct = {...product, isArchived: false};
    this.productService.update(product.id, updatedProduct).subscribe((response)=>{
      this.toastService.show('Product restored successfully!', {
        classname: 'bg-success text-light',
      });
    });
    
  }

  showProduct(product: Product) : boolean{
    var result = true;
    if(this.activeTab == 'ACTIVE' && product.isArchived == true){
      return false;
    }
    if(this.activeTab == 'ARCHIVED' && product.isArchived == false){
      return false;
    }
    if(product.name!.toLowerCase().includes(this.searchTerm.toLowerCase())){
      result = true;
    }
    else{
      result = false;
    }

    return result;
  }
}
