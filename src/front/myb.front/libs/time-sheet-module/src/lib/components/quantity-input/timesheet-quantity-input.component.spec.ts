import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimesheetQuantityInputComponent } from './timesheet-quantity-input.component';

describe('TimesheetQuantityInputComponent', () => {
  let component: TimesheetQuantityInputComponent;
  let fixture: ComponentFixture<TimesheetQuantityInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimesheetQuantityInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TimesheetQuantityInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
