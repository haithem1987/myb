import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddItemToInvoiceComponent } from './addItemToInvoice.component';

describe('AddItemToInvoiceComponent', () => {
  let component: AddItemToInvoiceComponent;
  let fixture: ComponentFixture<AddItemToInvoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddItemToInvoiceComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddItemToInvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
