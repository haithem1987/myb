import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentCreationComponent } from '../document-creation.component';

describe('DocumentCreationComponent', () => {
  let component: DocumentCreationComponent;
  let fixture: ComponentFixture<DocumentCreationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentCreationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
