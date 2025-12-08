import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FolderResolverComponent } from './FolderResolver.component';

describe('FolderResolverComponent', () => {
  let component: FolderResolverComponent;
  let fixture: ComponentFixture<FolderResolverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolderResolverComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FolderResolverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
