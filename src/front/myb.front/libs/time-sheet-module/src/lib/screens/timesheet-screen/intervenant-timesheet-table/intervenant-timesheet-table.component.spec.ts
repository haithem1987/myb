import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IntervenantTimesheetTableComponent } from './intervenant-timesheet-table.component';

describe('IntervenantTimesheetTableComponent', () => {
  let component: IntervenantTimesheetTableComponent;
  let fixture: ComponentFixture<IntervenantTimesheetTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntervenantTimesheetTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IntervenantTimesheetTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
