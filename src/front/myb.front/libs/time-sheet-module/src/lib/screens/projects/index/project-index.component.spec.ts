import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectIndexComponent } from './project-index.component';

describe('ProjectIndexComponent', () => {
  let component: ProjectIndexComponent;
  let fixture: ComponentFixture<ProjectIndexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectIndexComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
