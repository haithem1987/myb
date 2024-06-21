import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListInvoiceComponent } from './listInvoice.component';

describe('ListInvoiceComponent', () => {
  let component: ListInvoiceComponent;
  let fixture: ComponentFixture<ListInvoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListInvoiceComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ListInvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
