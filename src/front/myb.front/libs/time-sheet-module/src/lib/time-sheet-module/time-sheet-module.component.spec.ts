import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimeSheetModuleComponent } from './time-sheet-module.component';

describe('TimeSheetModuleComponent', () => {
  let component: TimeSheetModuleComponent;
  let fixture: ComponentFixture<TimeSheetModuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeSheetModuleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeSheetModuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
