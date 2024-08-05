import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { Product } from '../../../models/product.model';
import { Observable } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateProductComponent } from '../create-product/createProduct.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'myb-front-list-product',
  standalone: true,
  imports: [CommonModule, RouterLink,CreateProductComponent,FormsModule],
  templateUrl: './listProduct.component.html',
  styleUrl: './listProduct.component.css',
})
export class ListProductComponent {
  private productService = inject( ProductService);
  products$ : Observable<Product[]> = this.productService.products$;
  searchTerm: string = '';

  modalService = inject(NgbModal);

  openModal() {
		this.modalService.open(CreateProductComponent, { size: 'lg' });
	}
}
