import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthConfirmationModalComponent } from './auth-confirmation-modal.component';

describe('AuthConfirmationModalComponent', () => {
  let component: AuthConfirmationModalComponent;
  let fixture: ComponentFixture<AuthConfirmationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthConfirmationModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthConfirmationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
