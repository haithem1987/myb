import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimesheetStatusButtonsComponent } from './timesheet-status-buttons.component';

describe('TimesheetStatusButtonsComponent', () => {
  let component: TimesheetStatusButtonsComponent;
  let fixture: ComponentFixture<TimesheetStatusButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimesheetStatusButtonsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TimesheetStatusButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
