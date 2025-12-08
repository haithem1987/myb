import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocManagementModuleComponent } from './doc-management-module.component';

describe('DocManagementModuleComponent', () => {
  let component: DocManagementModuleComponent;
  let fixture: ComponentFixture<DocManagementModuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocManagementModuleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DocManagementModuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
