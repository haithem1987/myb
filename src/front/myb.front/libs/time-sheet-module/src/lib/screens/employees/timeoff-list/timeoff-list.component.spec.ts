import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimeoffListComponent } from './timeoff-list.component';

describe('TimeoffListComponent', () => {
  let component: TimeoffListComponent;
  let fixture: ComponentFixture<TimeoffListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeoffListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeoffListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
