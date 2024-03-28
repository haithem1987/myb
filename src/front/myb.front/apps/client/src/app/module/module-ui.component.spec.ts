import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModuleUiComponent } from './module-ui.component';

describe('ModuleUiComponent', () => {
  let component: ModuleUiComponent;
  let fixture: ComponentFixture<ModuleUiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModuleUiComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModuleUiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
