import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimesheetActionButtonsComponent } from './timesheet-action-buttons.component';

describe('TimesheetActionButtonsComponent', () => {
  let component: TimesheetActionButtonsComponent;
  let fixture: ComponentFixture<TimesheetActionButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimesheetActionButtonsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TimesheetActionButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
