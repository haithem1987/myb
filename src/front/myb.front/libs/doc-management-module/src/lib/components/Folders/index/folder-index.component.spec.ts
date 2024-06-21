import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FolderIndexComponent } from './folder-index.component';

describe('FolderIndexComponent', () => {
  let component: FolderIndexComponent;
  let fixture: ComponentFixture<FolderIndexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolderIndexComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FolderIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
