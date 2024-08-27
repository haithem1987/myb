import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimesheetSettingsComponent } from './timesheet-settings.component';

describe('TimesheetSettingsComponent', () => {
  let component: TimesheetSettingsComponent;
  let fixture: ComponentFixture<TimesheetSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimesheetSettingsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TimesheetSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
