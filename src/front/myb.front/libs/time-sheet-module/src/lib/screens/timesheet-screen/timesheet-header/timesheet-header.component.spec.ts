import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimesheetHeaderComponent } from './timesheet-header.component';

describe('TimesheetHeaderComponent', () => {
  let component: TimesheetHeaderComponent;
  let fixture: ComponentFixture<TimesheetHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimesheetHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TimesheetHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
