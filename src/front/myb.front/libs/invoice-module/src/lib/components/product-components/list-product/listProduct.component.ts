import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { Product } from '../../../models/product.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'myb-front-list-product',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './listProduct.component.html',
  styleUrl: './listProduct.component.css',
})
export class ListProductComponent {
  private productService = inject( ProductService);
  products$ : Observable<Product[]> = this.productService.products$
}
