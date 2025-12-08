import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocModuleWidgetComponent } from './doc-module-widget.component';

describe('DocModuleWidgetComponent', () => {
  let component: DocModuleWidgetComponent;
  let fixture: ComponentFixture<DocModuleWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocModuleWidgetComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DocModuleWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
