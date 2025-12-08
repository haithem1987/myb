import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InvoiceModuleComponent } from './invoice-module.component';

describe('InvoiceModuleComponent', () => {
  let component: InvoiceModuleComponent;
  let fixture: ComponentFixture<InvoiceModuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceModuleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceModuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
