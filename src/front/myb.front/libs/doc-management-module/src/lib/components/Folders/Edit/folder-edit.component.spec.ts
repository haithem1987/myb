import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FolderEditComponent } from './folder-edit.component';

describe('FolderEditComponent', () => {
  let component: FolderEditComponent;
  let fixture: ComponentFixture<FolderEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolderEditComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FolderEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
