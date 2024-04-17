import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppsSectionComponent } from './apps-section.component';

describe('AppsSectionComponent', () => {
  let component: AppsSectionComponent;
  let fixture: ComponentFixture<AppsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppsSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
