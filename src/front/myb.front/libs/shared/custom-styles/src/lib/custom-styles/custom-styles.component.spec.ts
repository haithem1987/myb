import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomStylesComponent } from './custom-styles.component';

describe('CustomStylesComponent', () => {
  let component: CustomStylesComponent;
  let fixture: ComponentFixture<CustomStylesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomStylesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomStylesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
