import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditTaxComponent } from './editTax.component';

describe('EditTaxComponent', () => {
  let component: EditTaxComponent;
  let fixture: ComponentFixture<EditTaxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTaxComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditTaxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
