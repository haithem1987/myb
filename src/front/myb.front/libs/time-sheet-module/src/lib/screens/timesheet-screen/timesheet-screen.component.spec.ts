import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimesheetScreenComponent } from './timesheet-screen.component';

describe('TimesheetScreenComponent', () => {
  let component: TimesheetScreenComponent;
  let fixture: ComponentFixture<TimesheetScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimesheetScreenComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TimesheetScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
