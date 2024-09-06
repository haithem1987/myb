import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IntervenantTimesheetComponent } from './intervenant-timesheet.component';

describe('IntervenantTimesheetComponent', () => {
  let component: IntervenantTimesheetComponent;
  let fixture: ComponentFixture<IntervenantTimesheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntervenantTimesheetComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IntervenantTimesheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
