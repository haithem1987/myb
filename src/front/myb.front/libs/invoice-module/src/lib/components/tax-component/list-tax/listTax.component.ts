import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TaxService } from '../../../services/tax.service';
import { Observable } from 'rxjs';
import { Tax } from '../../../models/tax.model';

@Component({
  selector: 'myb-front-list-tax',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './listTax.component.html',
  styleUrl: './listTax.component.css',
})
export class ListTaxComponent implements OnInit {
  private taxService = inject(TaxService);
  taxes$: Observable<Tax[]> = this.taxService.taxes$;
  ngOnInit(): void {
    //this.taxService.getAll().subscribe();
  }
}
